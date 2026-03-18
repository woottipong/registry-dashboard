"use client"

import React, { useCallback, useMemo, useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, TagIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { EmptyState as AppEmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDeleteTag, useDeleteTags, useTags } from "@/hooks/use-tags"
import { BulkDeleteDialog, DeleteDialog } from "@/components/tag/delete-dialog"
import { TagTable } from "@/components/tag/tag-table"
import { ImageInspector } from "@/components/manifest/image-inspector"
import { useRegistry } from "@/hooks/use-registries"
import { useActivity } from "@/contexts/activity-context"
import type { Tag } from "@/types/registry"

interface TagExplorerClientProps {
  registryId: string
  repoName: string
}

const PER_PAGE = 50

function TagExplorerClient({ registryId, repoName }: TagExplorerClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTag = searchParams.get("tag")

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [tagsToDelete, setTagsToDelete] = useState<Tag[]>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // reset to first page on new search
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch data
  const registryQuery = useRegistry(registryId)
  const tagsQuery = useTags(registryId, repoName, page, PER_PAGE)
  const deleteTag = useDeleteTag()
  const deleteTags = useDeleteTags()

  const canDelete = registryQuery.data?.capabilities?.canDelete ?? false
  const { addActivity } = useActivity()

  // Memoize tags to prevent dependency issues
  const memoizedTags = useMemo(() => tagsQuery.data?.items ?? [], [tagsQuery.data?.items])
  const meta = tagsQuery.data?.meta

  // Client-side search filter (only filters the current page for generic registries;
  // Docker Hub already server-paginates so searching resets to p1 above)
  const filteredTags = useMemo(() => {
    if (!debouncedSearch.trim()) return memoizedTags
    const lowerSearch = debouncedSearch.toLowerCase()
    return memoizedTags.filter(tag => tag.name.toLowerCase().includes(lowerSearch))
  }, [memoizedTags, debouncedSearch])

  // Derive selected tags from row indices (TanStack Table uses string indices as default row IDs)
  const selectedRowTags = useMemo(
    () => filteredTags.filter((_, i) => rowSelection[String(i)]),
    [filteredTags, rowSelection],
  )

  // Derived pagination
  const totalTags = meta?.total ?? memoizedTags.length
  const totalPages = meta?.totalPages ?? 1

  // Memoize shared tags calculation
  const sharedWithTag = useMemo(() => {
    if (!tagToDelete?.digest) return []
    return memoizedTags
      .filter((t) => t.digest === tagToDelete.digest && t.name !== tagToDelete.name)
      .map((t) => t.name)
  }, [memoizedTags, tagToDelete])

  // Tags that are NOT selected but will also be deleted because they share a digest with a selected tag
  const bulkSideEffectTags = useMemo(() => {
    if (selectedRowTags.length === 0) return []
    const selectedDigests = new Set(selectedRowTags.map((t) => t.digest).filter(Boolean))
    const selectedNames = new Set(selectedRowTags.map((t) => t.name))
    return memoizedTags
      .filter((t) => !selectedNames.has(t.name) && t.digest && selectedDigests.has(t.digest))
      .map((t) => t.name)
  }, [selectedRowTags, memoizedTags])

  // Tag count display uses real total from meta
  const tagCountDisplay = `${totalTags} ${totalTags === 1 ? "tag" : "tags"}`
  const repositoryNamespace = useMemo(() => {
    const segments = repoName.split("/")
    return segments.length > 1 ? segments.slice(0, -1).join("/") : ""
  }, [repoName])

  // Memoize event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
  }, [])

  const handleBackToRepositories = useCallback(() => {
    const params = new URLSearchParams({ registry: registryId })
    params.set("namespace", repositoryNamespace === "" ? "_root" : repositoryNamespace)
    router.push(`/repos?${params.toString()}`)
  }, [registryId, repositoryNamespace, router])

  const handleDeleteClick = useCallback((tag: Tag) => {
    setTagToDelete(tag)
  }, [])

  const handleBulkDeleteClick = useCallback((tags: Tag[]) => {
    setTagsToDelete(tags)
  }, [])

  const handleDeleteConfirm = useCallback(
    (tag: Tag) => {
      deleteTag.mutate(
        { registryId, repoName, digest: tag.digest },
        {
          onSuccess: () => {
            toast.success(`Tag "${tag.name}" deleted`)
            setTagToDelete(null)
          },
          onError: (error) => {
            toast.error(error.message)
            setTagToDelete(null)
          },
        },
      )
    },
    [deleteTag, registryId, repoName],
  )

  const handleBulkDeleteConfirm = useCallback(() => {
    const snapshot = [...tagsToDelete]
    const deletedNames = new Set(snapshot.map((t: Tag) => t.name))
    const digests = snapshot.map((t: Tag) => t.digest).filter(Boolean)
    deleteTags.mutate(
      { registryId, repoName, digests },
      {
        onSuccess: () => {
          setTagsToDelete([])
          // Only clear row selection for deleted tags, not any newly selected ones
          setRowSelection(prev => {
            const next: Record<string, boolean> = {}
            for (const [key, val] of Object.entries(prev)) {
              if (!deletedNames.has(key)) next[key] = val
            }
            return next
          })

          addActivity({
            type: 'delete',
            repository: repoName,
            registry: registryQuery.data?.name || registryId,
            user: 'user',
          })

          snapshot.forEach((t, i) => {
            setTimeout(() => toast.success(`Tag "${t.name}" deleted`), i * 180)
          })
        },
        onError: (error: Error) => {
          toast.error(error.message)
          setTagsToDelete([])
        },
      },
    )
  }, [deleteTags, registryId, repoName, tagsToDelete, addActivity, registryQuery.data?.name])

  // Show image inspector if a tag is selected
  if (selectedTag) {
    return (
      <ImageInspector
        registryId={registryId}
        repoName={repoName}
        tag={selectedTag}
        registryName={registryQuery.data?.name}
        registryUrl={registryQuery.data?.url}
      />
    )
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToRepositories} className="w-fit">
            <ChevronLeftIcon data-icon="inline-start" />
            Repositories
          </Button>
          {registryQuery.data ? <Badge variant="outline">{registryQuery.data.name}</Badge> : null}
          <Badge variant="secondary">{tagCountDisplay}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{repoName}</h1>
        </div>
        <p className="text-sm text-muted-foreground">Tags in this repository.</p>
      </div>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="gap-2 border-b pb-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <CardTitle>Tag List</CardTitle>
              <CardDescription>{tagCountDisplay}</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={handleSearchChange}
                className="pl-9 pr-9"
                placeholder="Filter tags…"
              />
              {search ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={handleClearSearch}
                >
                  <XIcon className="size-3.5" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          {tagsQuery.isError ? (
            <AppEmptyState
              icon={<TagIcon className="size-5" />}
              title="Failed to load tags"
              description={tagsQuery.error?.message ?? "Unable to fetch tags."}
              className="rounded-2xl bg-background/70"
            />
          ) : filteredTags.length === 0 && !tagsQuery.isLoading ? (
            <AppEmptyState
              icon={<TagIcon className="size-5" />}
              title={search ? "No matching tags" : "No tags yet"}
              description={search ? "Try a different search." : "Tags will appear here after images are pushed."}
              action={search ? <Button onClick={handleClearSearch}>Clear search</Button> : undefined}
              className="rounded-2xl bg-background/70"
            />
          ) : (
            <>
              <TagTable
                registryId={registryId}
                repoName={repoName}
                tags={filteredTags}
                canDelete={canDelete}
                isLoading={tagsQuery.isLoading}
                registryUrl={registryQuery.data?.url}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                onDeleteClick={handleDeleteClick}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 border-t pt-3">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || tagsQuery.isFetching}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      aria-label="Previous page"
                    >
                      <ChevronLeftIcon className="size-4" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages || tagsQuery.isFetching}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRightIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        tag={tagToDelete}
        sharedWith={sharedWithTag}
        open={tagToDelete !== null}
        onOpenChange={(open) => { if (!open) setTagToDelete(null) }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteTag.isPending}
      />

      {/* Bulk Delete Dialog */}
      {tagsToDelete.length > 0 && (
        <BulkDeleteDialog
          tags={tagsToDelete}
          sideEffectTags={bulkSideEffectTags}
          open
          onOpenChange={(open: boolean) => { if (!open) setTagsToDelete([]) }}
          onConfirm={handleBulkDeleteConfirm}
          isPending={deleteTags.isPending}
        />
      )}

      {/* Floating selection action bar */}
      <AnimatePresence>
        {canDelete && selectedRowTags.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-full border border-border bg-background px-5 py-2.5 shadow-xl shadow-black/20 ring-1 ring-black/5">
              <span className="text-sm font-medium tabular-nums">
                {selectedRowTags.length} {selectedRowTags.length === 1 ? "tag" : "tags"} selected
              </span>
              <div className="h-4 w-px bg-border" />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-full px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setRowSelection({})}
              >
                Clear
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 rounded-full px-4"
                onClick={() => handleBulkDeleteClick(selectedRowTags)}
              >
                <Trash2Icon className="size-3.5" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// Main component wrapped with error boundary
class TagExplorerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TagExplorer error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-6 rounded-full bg-destructive/10 mb-6">
            <div className="text-4xl">⚠️</div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            An unexpected error occurred while loading the tag explorer.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

const TagExplorerWithBoundary = React.memo((props: TagExplorerClientProps) => (
  <TagExplorerErrorBoundary>
    <TagExplorerClient {...props} />
  </TagExplorerErrorBoundary>
))

TagExplorerWithBoundary.displayName = 'TagExplorerWithBoundary'

export { TagExplorerWithBoundary as TagExplorerClient }
