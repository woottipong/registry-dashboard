"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REGISTRY } from "@/lib/query-client"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Tag } from "@/types/registry"

interface TagsResult {
  items: Tag[]
  meta?: PaginationMeta
}

function encodeRepoPath(repoName: string): string {
  return repoName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export function useTags(registryId: string, repoName: string) {
  return useQuery({
    queryKey: ["tags", registryId, repoName],
    enabled: Boolean(registryId && repoName),
    staleTime: STALE_TIME_REGISTRY,
    queryFn: async (): Promise<TagsResult> => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const response = await fetch(
        `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags`,
        { cache: "no-store" },
      )

      const payload = (await response.json()) as ApiResponse<Tag[]>

      if (!response.ok || !payload.success || payload.data === null) {
        throw new Error(payload.error?.message ?? "Unable to fetch tags")
      }

      return {
        items: payload.data,
        meta: payload.meta,
      }
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
        { method: "DELETE" },
      )

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to delete tag")
      }

      return { registryId, repoName }
    },
    onMutate: async ({ registryId, repoName, digest }) => {
      const queryKey = ["tags", registryId, repoName] as const

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
        queryKey: ["tags", variables.registryId, variables.repoName],
      })
    },
  })
}
