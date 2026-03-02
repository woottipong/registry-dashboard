"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_REGISTRY } from "@/lib/query-client"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Repository } from "@/types/registry"

interface RepositoryQueryOptions {
  page?: number
  perPage?: number
  search?: string
}

interface RepositoryQueryResult {
  items: Repository[]
  meta?: PaginationMeta
}

function makeQueryString(options: RepositoryQueryOptions): string {
  const params = new URLSearchParams()

  if (options.page) params.set("page", String(options.page))
  if (options.perPage) params.set("perPage", String(options.perPage))
  if (options.search) params.set("search", options.search)

  const query = params.toString()
  return query ? `?${query}` : ""
}

async function fetchRepositories(
  registryId: string,
  options: RepositoryQueryOptions,
): Promise<RepositoryQueryResult> {
  const queryString = makeQueryString(options)
  const response = await fetch(
    `/api/v1/registries/${registryId}/repositories${queryString}`,
    {
      cache: "no-store",
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
    staleTime: STALE_TIME_REGISTRY,
    queryFn: () => fetchRepositories(registryId, options),
  })
}

export function useSearchRepositories(registryId: string, query: string) {
  return useQuery({
    queryKey: ["repositories", "search", registryId, query],
    enabled: Boolean(registryId && query.trim().length > 0),
    staleTime: STALE_TIME_REGISTRY,
    queryFn: () => fetchRepositories(registryId, { search: query, page: 1, perPage: 25 }),
  })
}
