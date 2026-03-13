"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import { assertApiSuccess } from "@/lib/error-handling"
import { queryKeys } from "@/lib/constants/query-keys"
import type { Namespace } from "@/types/registry"

async function fetchNamespaces(registryId: string): Promise<Namespace[]> {
  const response = await fetch(`/api/v1/registries/${registryId}/namespaces`, {
    cache: "default",
  })

  const data = await assertApiSuccess<Namespace[]>(response)

  if (!Array.isArray(data)) {
    throw new Error("Unable to fetch namespaces")
  }

  return data
}

export function useNamespaces(registryId: string) {
  return useQuery({
    queryKey: queryKeys.namespaces.byRegistry(registryId),
    enabled: Boolean(registryId),
    staleTime: STALE_TIME_REPOSITORIES,
    queryFn: () => fetchNamespaces(registryId),
  })
}
