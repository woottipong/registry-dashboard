"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import type { Namespace } from "@/types/registry"

async function fetchNamespaces(registryId: string): Promise<Namespace[]> {
  const response = await fetch(`/api/v1/registries/${registryId}/namespaces`, {
    cache: "default",
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.errors?.[0]?.message ?? "Unable to fetch namespaces"
    )
  }

  const data = await response.json()
  return data.namespaces as Namespace[]
}

export function useNamespaces(registryId: string) {
  return useQuery({
    queryKey: ["namespaces", registryId],
    enabled: Boolean(registryId),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchNamespaces(registryId),
  })
}
