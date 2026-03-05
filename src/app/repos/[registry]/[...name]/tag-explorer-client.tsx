"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SearchIcon, TagIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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

export function TagExplorerClient({ registryId, repoName }: TagExplorerClientProps) {
  const searchParams = useSearchParams()
  const selectedTag = searchParams.get("tag")

  const [search, setSearch] = useState("")
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null)
  const [tagsToDelete, setTagsToDelete] = useState<Tag[]>([])

  // Fetch data
  const registryQuery = useRegistry(registryId)
  const tagsQuery = useTags(registryId, repoName)
  const deleteTag = useDeleteTag()
  const deleteTags = useDeleteTags()

  const canDelete = registryQuery.data?.capabilities?.canDelete ?? false
  const tags = tagsQuery.data?.items ?? []

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!search.trim()) return tags
    const lowerSearch = search.toLowerCase()
    return tags.filter(tag => tag.name.toLowerCase().includes(lowerSearch))
  }, [tags, search])

  // Event handlers
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

  // Get tags that share the same digest as the tag being deleted
  const sharedWithTag = useMemo(() => {
    if (!tagToDelete?.digest) return []
    return tags
      .filter((t) => t.digest === tagToDelete.digest && t.name !== tagToDelete.name)
      .map((t) => t.name)
  }, [tags, tagToDelete])

  // Count unique digests for bulk delete
  const bulkUniqueDigestCount = useMemo(() => {
    return new Set(tagsToDelete.map((t) => t.digest).filter((d) => d)).size
  }, [tagsToDelete])

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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-2xl font-semibold">{repoName}</h1>
            {registryQuery.data && (
              <Badge variant="secondary">{registryQuery.data.name}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <TagIcon className="mr-1 inline size-3.5" />
            {tags.length} {tags.length === 1 ? "tag" : "tags"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          placeholder="Filter tags…"
        />
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
            <button
              onClick={() => setSearch("")}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Clear search
            </button>
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
