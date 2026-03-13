"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import { encodeRepoPath } from "@/lib/utils"
import { assertApiSuccess } from "@/lib/error-handling"
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

  if (options.page !== undefined) params.set("page", String(options.page))
  if (options.perPage !== undefined) params.set("perPage", String(options.perPage))
  if (options.search) params.set("search", options.search)
  // Use !== undefined so that empty-string namespace (root) is correctly sent as ?namespace=
  if (options.namespace !== undefined) params.set("namespace", options.namespace)

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

  const payload = (await response.json()) as ApiResponse<Repository[]>

  if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
    throw new Error(payload.error?.message ?? "Unable to fetch repositories")
  }

  const items = payload.data
  const meta: PaginationMeta = payload.meta ?? {
    page: options.page || 1,
    perPage: options.perPage || items.length,
    total: items.length,
    totalPages: 1,
  }
  return { items, meta }
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
    queryFn: () => fetchRepositories(registryId, { search: query, page: 1, perPage: 100 }),
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

      await assertApiSuccess<null>(response)
      return { registryId, repositoryName }
    },
    onSuccess: async ({ registryId }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.repositories.prefix(registryId) })
    },
  })
}
