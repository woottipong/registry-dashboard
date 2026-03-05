"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import type { Namespace } from "@/types/registry"

async function fetchNamespaces(registryId: string): Promise<Namespace[]> {
  const response = await fetch(`/api/v1/registries/${registryId}/namespaces`, {
    cache: "default",
  })

  const data = await response.json()

  if (response.ok && data.success && Array.isArray(data.data)) {
    return data.data as Namespace[]
  }

  throw new Error(data.error?.message ?? data.errors?.[0]?.message ?? "Unable to fetch namespaces")
}

export function useNamespaces(registryId: string) {
  return useQuery({
    queryKey: ["namespaces", registryId],
    enabled: Boolean(registryId),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchNamespaces(registryId),
  })
}
