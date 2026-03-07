"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_TAGS } from "@/lib/query-client"
import { encodeRepoPath } from "@/lib/utils"
import { queryKeys } from "@/lib/constants/query-keys"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Tag } from "@/types/registry"

interface TagsResult {
  items: Tag[]
  meta?: PaginationMeta
}

export function useTags(registryId: string, repoName: string, page = 1, perPage = 50) {
  return useQuery({
    queryKey: queryKeys.tags.byRepo(registryId, repoName, page, perPage),
    enabled: Boolean(registryId && repoName),
    staleTime: STALE_TIME_TAGS,
    queryFn: async (): Promise<TagsResult> => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage) })
      const response = await fetch(
        `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags?${params}`,
        { cache: "default" }
      )

      const data = await response.json()

      if (response.ok && data.success && Array.isArray(data.data)) {
        const tags: Tag[] = data.data
        const meta: PaginationMeta = data.meta ?? {
          page,
          perPage,
          total: tags.length,
          totalPages: 1,
        }
        return { items: tags, meta }
      }

      if (data.errors?.[0]) {
        throw new Error(data.errors[0].message || "Unable to fetch tags")
      }
      if (data.error?.message) {
        throw new Error(data.error.message)
      }

      throw new Error("Unable to fetch tags")
    },
  })
}

export function useDeleteTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      registryId,
      repoName,
      digests,
    }: {
      registryId: string
      repoName: string
      digests: string[]
    }) => {
      const encodedRepoPath = encodeRepoPath(repoName)

      // Deduplicate — multiple tags can share one sha256 digest
      const uniqueDigests = [...new Set(digests.filter((d) => d.startsWith("sha256:")))]

      for (const digest of uniqueDigests) {
        const encodedDigest = encodeURIComponent(digest)
        const response = await fetch(
          `/api/v1/registries/${registryId}/manifests/${encodedRepoPath}/${encodedDigest}`,
          { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } },
        )
        const payload = (await response.json()) as ApiResponse<null>
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? `Unable to delete ${digest}`)
        }
      }

      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digests }) => {
      const queryKeyPrefix = ["tags", registryId, repoName] as const
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      const previousEntries = queryClient.getQueriesData<TagsResult>({ queryKey: queryKeyPrefix })
      const digestSet = new Set(digests)
      queryClient.setQueriesData<TagsResult>({ queryKey: queryKeyPrefix }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.filter((t) => !digestSet.has(t.digest)) }
      })
      return { previousEntries }
    },
    onError: (_error, _variables, context) => {
      for (const [key, data] of context?.previousEntries ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSuccess: async ({ registryId, repoName }) => {
      // Use prefix key so ALL pages for this repo are invalidated, not just page 1
      await queryClient.invalidateQueries({ queryKey: ["tags", registryId, repoName] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      registryId,
      repoName,
      digest,
    }: {
      registryId: string
      repoName: string
      digest: string
    }) => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const encodedDigest = encodeURIComponent(digest)
      const response = await fetch(
        `/api/v1/registries/${registryId}/manifests/${encodedRepoPath}/${encodedDigest}`,
        { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } },
      )

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to delete tag")
      }

      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digest }) => {
      // Use prefix so cancel/update applies to ALL pages, not just page 1
      const queryKeyPrefix = ["tags", registryId, repoName] as const

      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })

      // Snapshot every matching cache entry for rollback
      const previousEntries = queryClient.getQueriesData<TagsResult>({ queryKey: queryKeyPrefix })

      // Optimistically remove the deleted tag from all pages
      queryClient.setQueriesData<TagsResult>({ queryKey: queryKeyPrefix }, (old) => {
        if (!old) return old
        return { ...old, items: old.items.filter((tag) => tag.digest !== digest) }
      })

      return { previousEntries }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousEntries) {
        for (const [key, data] of context.previousEntries) {
          queryClient.setQueryData(key, data)
        }
      }
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["tags", variables.registryId, variables.repoName],
      })
    },
  })
}
