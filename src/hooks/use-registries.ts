"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REGISTRIES } from "@/lib/query-client"
import { assertApiSuccess } from "@/lib/error-handling"
import { queryKeys } from "@/lib/constants/query-keys"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

interface RegistryPayload {
  name: string
  url: string
  provider?: RegistryConnection["provider"]
  authType?: RegistryConnection["authType"]
  credentials?: RegistryConnection["credentials"]
  namespace?: string
  isDefault?: boolean
}

export function useRegistries(options?: { initialData?: RegistryConnection[] }) {
  return useQuery({
    queryKey: queryKeys.registries.all,
    staleTime: STALE_TIME_REGISTRIES,
    ...options,
    queryFn: async () => {
      const response = await fetch("/api/v1/registries", { cache: "no-store" })
      return assertApiSuccess<RegistryConnection[]>(response)
    },
  })
}

export function useRegistry(id: string) {
  return useQuery({
    queryKey: queryKeys.registries.byId(id),
    enabled: Boolean(id),
    staleTime: STALE_TIME_REGISTRIES,
    queryFn: async () => {
      const response = await fetch(`/api/v1/registries/${id}`, { cache: "no-store" })
      return assertApiSuccess<RegistryConnection>(response)
    },
  })
}

export function usePingRegistry(id: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v1/registries/${id}/ping`)
      return assertApiSuccess<{ status: "ok" | "error"; latencyMs: number }>(response)
    },
  })
}

export function useAddRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: RegistryPayload) => {
      const response = await fetch("/api/v1/registries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      return assertApiSuccess<RegistryConnection>(response)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.registries.all })
    },
  })
}

export function useUpdateRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: RegistryPayload }) => {
      const response = await fetch(`/api/v1/registries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      return assertApiSuccess<RegistryConnection>(response)
    },
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.registries.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.registries.byId(updated.id) }),
      ])
    },
  })
}

export function useSetDefaultRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, registry }: { id: string; registry: RegistryConnection }) => {
      const payload: RegistryPayload = {
        name: registry.name,
        url: registry.url,
        provider: registry.provider,
        authType: registry.authType,
        credentials: registry.credentials,
        namespace: registry.namespace,
        isDefault: true,
      }

      const response = await fetch(`/api/v1/registries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      return assertApiSuccess<RegistryConnection>(response)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.registries.all })
    },
  })
}

export function useDeleteRegistry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/registries/${id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as ApiResponse<null>

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Delete failed")
      }

      return id
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.registries.all })
    },
  })
}
