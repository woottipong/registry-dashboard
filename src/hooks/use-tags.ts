"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_TAGS } from "@/lib/query-client"
import { encodeRepoPath } from "@/lib/utils"
import { assertApiSuccess } from "@/lib/error-handling"
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
        { cache: "no-store" }
      )

      const payload = (await response.json()) as ApiResponse<Tag[]>

      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error?.message ?? "Unable to fetch tags")
      }

      const items = payload.data
      const meta: PaginationMeta = payload.meta ?? {
        page,
        perPage,
        total: items.length,
        totalPages: 1,
      }
      return { items, meta }
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
        await assertApiSuccess<null>(response)
      }

      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digests }) => {
      const queryKeyPrefix = queryKeys.tags.prefix(registryId, repoName)
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
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.prefix(variables.registryId, variables.repoName) })
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

      await assertApiSuccess<null>(response)
      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digest }) => {
      const queryKeyPrefix = queryKeys.tags.prefix(registryId, repoName)
      await queryClient.cancelQueries({ queryKey: queryKeyPrefix })
      const previousEntries = queryClient.getQueriesData<TagsResult>({ queryKey: queryKeyPrefix })
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
        queryKey: queryKeys.tags.prefix(variables.registryId, variables.repoName),
      })
    },
  })
}
