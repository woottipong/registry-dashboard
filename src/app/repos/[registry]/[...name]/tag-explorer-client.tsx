"use client"

import React, { useCallback, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SearchIcon, TagIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BulkDeleteDialog, DeleteDialog } from "@/components/tag/delete-dialog"
import { TagTable } from "@/components/tag/tag-table"
import { ImageInspector } from "@/components/manifest/image-inspector"
import { useRegistry } from "@/hooks/use-registries"
import { useDeleteTag, useDeleteTags, useTags } from "@/hooks/use-tags"
import type { Tag } from "@/types/registry"

interface TagExplorerClientProps {
  registryId: string
  repoName: string
}

function TagExplorerClient({ registryId, repoName }: TagExplorerClientProps) {
  const searchParams = useSearchParams()
  const selectedTag = searchParams.get("tag")

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [tagsToDelete, setTagsToDelete] = useState<Tag[]>([])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch data
  const registryQuery = useRegistry(registryId)
  const tagsQuery = useTags(registryId, repoName)
  const deleteTag = useDeleteTag()
  const deleteTags = useDeleteTags()

  const canDelete = registryQuery.data?.capabilities?.canDelete ?? false
  const tags = tagsQuery.data?.items ?? []

  // Memoize expensive computations
  const filteredTags = useMemo(() => {
    if (!debouncedSearch.trim()) return tags
    const lowerSearch = debouncedSearch.toLowerCase()
    return tags.filter(tag => tag.name.toLowerCase().includes(lowerSearch))
  }, [tags, debouncedSearch])

  // Memoize shared tags calculation
  const sharedWithTag = useMemo(() => {
    if (!tagToDelete?.digest) return []
    return tags
      .filter((t) => t.digest === tagToDelete.digest && t.name !== tagToDelete.name)
      .map((t) => t.name)
  }, [tags, tagToDelete])

  // Memoize bulk unique digest count
  const bulkUniqueDigestCount = useMemo(() => {
    return new Set(tagsToDelete.map((t) => t.digest).filter((d) => d)).size
  }, [tagsToDelete])

  // Memoize tag count display
  const tagCountDisplay = useMemo(() => {
    return `${tags.length} ${tags.length === 1 ? "tag" : "tags"}`
  }, [tags.length])

  // Memoize event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch("")
  }, [])

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
    const digests = tagsToDelete.map((t) => t.digest).filter(Boolean)
    deleteTags.mutate(
      { registryId, repoName, digests },
      {
        onSuccess: () => {
          toast.success(`${tagsToDelete.length} tags deleted successfully`)
          setTagsToDelete([])
        },
        onError: (error) => {
          toast.error(error.message)
          setTagsToDelete([])
        },
      },
    )
  }, [deleteTags, registryId, repoName, tagsToDelete])

  // Show image inspector if a tag is selected
  if (selectedTag) {
    return (
      <ImageInspector
        registryId={registryId}
        repoName={repoName}
        tag={selectedTag}
        registryName={registryQuery.data?.name}
      />
    )
  }

  return (
    <section className="space-y-6">
      {/* Enhanced Header */}
      <div className="relative rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-primary/10 border border-primary/20 p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TagIcon className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{repoName}</h1>
                <p className="text-sm text-muted-foreground">Tag Explorer</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {registryQuery.data && (
                <Badge variant="outline">{registryQuery.data.name}</Badge>
              )}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TagIcon className="size-3" />
                <span>{tagCountDisplay}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={handleSearchChange}
          className="pl-8 pr-8"
          placeholder="Filter tags…"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-muted"
            onClick={handleClearSearch}
          >
            <XIcon className="size-3" />
          </Button>
        )}
      </div>

      {/* Content */}
      {tagsQuery.isError ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            {tagsQuery.error?.message ?? "Failed to load tags"}
          </p>
        </div>
      ) : filteredTags.length === 0 && !tagsQuery.isLoading ? (
        <div className="rounded-3xl border border-dashed border-border/50 bg-gradient-to-br from-card/50 to-card/20 p-12 text-center backdrop-blur-sm animate-in fade-in duration-300">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <TagIcon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">
            {search ? "No matching tags found" : "No tags in this repository"}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
            {search
              ? "Try adjusting your search terms or clearing the filter to see all available tags."
              : "Tags will appear here once images are pushed to this repository. Check back later or push your first image to get started."
            }
          </p>
          {search && (
            <Button onClick={handleClearSearch}>
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <TagTable
          registryId={registryId}
          repoName={repoName}
          tags={filteredTags}
          canDelete={canDelete}
          isLoading={tagsQuery.isLoading}
          onDeleteClick={handleDeleteClick}
          onBulkDeleteClick={handleBulkDeleteClick}
        />
      )}

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
          count={tagsToDelete.length}
          uniqueDigestCount={bulkUniqueDigestCount}
          open
          onOpenChange={(open: boolean) => { if (!open) setTagsToDelete([]) }}
          onConfirm={handleBulkDeleteConfirm}
          isPending={deleteTags.isPending}
        />
      )}
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
