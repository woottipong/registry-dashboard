"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import { encodeRepoPath } from "@/lib/utils"
import { queryKeys } from "@/lib/constants/query-keys"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Repository } from "@/types/registry"

export interface RepositoryQueryOptions {
  page?: number
  perPage?: number
  search?: string
  namespace?: string
  enabled?: boolean
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
  if (options.namespace) params.set("namespace", options.namespace)

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
    { cache: "default" }
  )

  if (response.ok) {
    const data = await response.json()

    // ApiResponse<Repository[]> format: { success, data: Repository[], meta?: PaginationMeta }
    if (data.success && Array.isArray(data.data)) {
      const items: Repository[] = data.data
      const meta: PaginationMeta = data.meta ?? {
        page: options.page || 1,
        perPage: options.perPage || items.length,
        total: items.length,
        totalPages: 1,
      }
      return { items, meta }
    }
  }

  // Handle errors
  const errorData = await response.json().catch(() => ({}))
  if (errorData.errors?.[0]) {
    throw new Error(errorData.errors[0].message || "Unable to fetch repositories")
  }

  throw new Error("Unable to fetch repositories")
}

export function useRepositories(
  registryId: string,
  options: RepositoryQueryOptions = {},
) {
  const { enabled: callerEnabled = true, ...fetchOptions } = options
  return useQuery({
    queryKey: queryKeys.repositories.byRegistry(registryId, fetchOptions.page ?? 1, fetchOptions.perPage ?? 25, fetchOptions.search ?? "", fetchOptions.namespace ?? ""),
    enabled: callerEnabled && Boolean(registryId) && fetchOptions.namespace !== undefined,
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchRepositories(registryId, fetchOptions),
  })
}

export function useSearchRepositories(registryId: string, query: string) {
  return useQuery({
    queryKey: queryKeys.repositories.search(registryId, query),
    enabled: Boolean(registryId && query.trim().length > 0),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchRepositories(registryId, { search: query, page: 1, perPage: 100 }), // Increased from 25 to 100
  })
}

export function useDeleteRepository() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ registryId, repositoryName }: { registryId: string; repositoryName: string }) => {
      const encodedRepoPath = encodeRepoPath(repositoryName)

      const response = await fetch(
        `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}`,
        { method: "DELETE", headers: { "X-Requested-With": "XMLHttpRequest" } },
      )

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to delete repository")
      }

      return { registryId, repositoryName }
    },
    onSuccess: async ({ registryId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.prefix(registryId) })
    },
  })
}
