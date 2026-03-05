"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Repository } from "@/types/registry"

export interface RepositoryQueryOptions {
  page?: number
  perPage?: number
  search?: string
}

export interface RepositoryQueryResult {
  items: Repository[]
  meta?: PaginationMeta
}

export function makeRepositoryQueryString(options: RepositoryQueryOptions): string {
  const params = new URLSearchParams()

  if (options.page) params.set("page", String(options.page))
  if (options.perPage) params.set("perPage", String(options.perPage))
  if (options.search) params.set("search", options.search)

  const query = params.toString()
  return query ? `?${query}` : ""
}

export async function fetchRepositories(
  registryId: string,
  options: RepositoryQueryOptions,
): Promise<RepositoryQueryResult> {
  const queryString = makeRepositoryQueryString(options)
  const response = await fetch(
    `/api/v1/registries/${registryId}/repositories${queryString}`,
    {
      // Enable client-side caching for better performance
      cache: "default", // Changed from "no-store" to enable caching
    },
  )

  const payload = (await response.json()) as ApiResponse<Repository[]>

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.error?.message ?? "Unable to fetch repositories")
  }

  return {
    items: payload.data,
    meta: payload.meta,
  }
}

export function useRepositories(
  registryId: string,
  options: RepositoryQueryOptions = {},
) {
  return useQuery({
    queryKey: ["repositories", registryId, options.page ?? 1, options.perPage ?? 25, options.search ?? ""],
    enabled: Boolean(registryId),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchRepositories(registryId, options),
  })
}

export function useSearchRepositories(registryId: string, query: string) {
  return useQuery({
    queryKey: ["repositories", "search", registryId, query],
    enabled: Boolean(registryId && query.trim().length > 0),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchRepositories(registryId, { search: query, page: 1, perPage: 100 }), // Increased from 25 to 100
  })
}

export function useDeleteRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ registryId, repositoryName }: { registryId: string; repositoryName: string }) => {
      const encodedRepoPath = repositoryName
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/")

      const response = await fetch(
        `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}`,
        { method: "DELETE" },
      )

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to delete repository")
      }

      return { registryId, repositoryName }
    },
    onSuccess: async ({ registryId }) => {
      await queryClient.invalidateQueries({ queryKey: ["repositories", registryId] })
    },
  })
}
