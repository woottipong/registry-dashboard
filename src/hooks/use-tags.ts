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

export function useTags(registryId: string, repoName: string) {
  return useQuery({
    queryKey: queryKeys.tags.byRepo(registryId, repoName),
    enabled: Boolean(registryId && repoName),
    staleTime: STALE_TIME_TAGS,
    queryFn: async (): Promise<TagsResult> => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const response = await fetch(
        `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags`,
        { cache: "default" }
      )

      const data = await response.json()

      if (response.ok && data.success && Array.isArray(data.data)) {
        const tags: Tag[] = data.data
        return {
          items: tags,
          meta: {
            page: 1,
            perPage: tags.length,
            total: tags.length,
            totalPages: 1,
          }
        }
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
          { method: "DELETE" },
        )
        const payload = (await response.json()) as ApiResponse<null>
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? `Unable to delete ${digest}`)
        }
      }

      return { registryId, repoName }
    },
    onSuccess: async ({ registryId, repoName }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags.byRepo(registryId, repoName) })
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
        { method: "DELETE" },
      )

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to delete tag")
      }

      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digest }) => {
      const queryKey = queryKeys.tags.byRepo(registryId, repoName)

      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<TagsResult>(queryKey)

      if (previous) {
        queryClient.setQueryData<TagsResult>(queryKey, {
          ...previous,
          items: previous.items.filter((tag) => tag.digest !== digest),
        })
      }

      return { previous, queryKey }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tags.byRepo(variables.registryId, variables.repoName),
      })
    },
  })
}
