"use client"

import { useCallback, useMemo, useState } from "react"
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

  const registryQuery = useRegistry(registryId)
  const tagsQuery = useTags(registryId, repoName)
  const deleteTag = useDeleteTag()
  const deleteTags = useDeleteTags()

  const canDelete = registryQuery.data?.capabilities?.canDelete ?? false
  const allTags = tagsQuery.data?.items ?? []

  const filteredTags = useMemo(() => {
    const tags = tagsQuery.data?.items ?? []
    if (!search.trim()) return tags
    const lower = search.toLowerCase()
    return tags.filter((tag) => tag.name.toLowerCase().includes(lower))
  }, [tagsQuery.data?.items, search])

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

  const sharedWithTag = useMemo(() => {
    if (!tagToDelete?.digest) return []
    return allTags
      .filter((t) => t.digest === tagToDelete.digest && t.name !== tagToDelete.name)
      .map((t) => t.name)
  }, [allTags, tagToDelete])

  const bulkUniqueDigestCount = useMemo(() => {
    return new Set(tagsToDelete.map((t) => t.digest).filter((d) => d.startsWith("sha256:"))).size
  }, [tagsToDelete])

  const handleBulkDeleteConfirm = useCallback(() => {
    const digests = tagsToDelete.map((t) => t.digest).filter(Boolean)
    deleteTags.mutate(
      { registryId, repoName, digests },
      {
        onSuccess: () => {
          toast.success(`${tagsToDelete.length} tags deleted`)
          setTagsToDelete([])
        },
        onError: (error) => {
          toast.error(error.message)
          setTagsToDelete([])
        },
      },
    )
  }, [deleteTags, registryId, repoName, tagsToDelete])

  // Image inspector view when ?tag= is present
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

  const totalCount = tagsQuery.data?.items.length ?? 0

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{repoName}</h1>
            {registryQuery.data ? (
              <Badge variant="secondary">{registryQuery.data.name}</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <TagIcon className="mr-1 inline size-3.5" />
            {totalCount} {totalCount === 1 ? "tag" : "tags"}
          </p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          placeholder="Filter tags…"
        />
      </div>

      {tagsQuery.isError ? (
        <div className="rounded-card border border-destructive/30 bg-destructive/10 p-6 text-center">
          <p className="text-sm text-destructive">
            {tagsQuery.error?.message ?? "Failed to load tags"}
          </p>
        </div>
      ) : filteredTags.length === 0 && !tagsQuery.isLoading ? (
        <div className="rounded-card border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No tags match your filter." : "No tags found for this repository."}
          </p>
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

      <DeleteDialog
        tag={tagToDelete}
        sharedWith={sharedWithTag}
        open={tagToDelete !== null}
        onOpenChange={(open) => { if (!open) setTagToDelete(null) }}
        onConfirm={handleDeleteConfirm}
        isPending={deleteTag.isPending}
      />

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
