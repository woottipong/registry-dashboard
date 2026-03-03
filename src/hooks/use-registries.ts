"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { STALE_TIME_REGISTRY } from "@/lib/query-client"
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

const registryKeys = {
  all: ["registries"] as const,
  byId: (id: string) => ["registries", id] as const,
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T
}

async function handleApiResponse<T>(response: Response): Promise<T> {
  const payload = await readJson<ApiResponse<T>>(response)

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.error?.message ?? "Request failed")
  }

  return payload.data
}

export function useRegistries() {
  return useQuery({
    queryKey: registryKeys.all,
    staleTime: STALE_TIME_REGISTRY,
    queryFn: async () => {
      const response = await fetch("/api/v1/registries", { cache: "no-store" })
      return handleApiResponse<RegistryConnection[]>(response)
    },
  })
}

export function useRegistry(id: string) {
  return useQuery({
    queryKey: registryKeys.byId(id),
    enabled: Boolean(id),
    staleTime: STALE_TIME_REGISTRY,
    queryFn: async () => {
      const response = await fetch(`/api/v1/registries/${id}`, { cache: "no-store" })
      return handleApiResponse<RegistryConnection>(response)
    },
  })
}

export function usePingRegistry(id: string) {
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/v1/registries/${id}/ping`)
      return handleApiResponse<{ status: "ok" | "error"; latencyMs: number }>(response)
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

      return handleApiResponse<RegistryConnection>(response)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: registryKeys.all })
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

      return handleApiResponse<RegistryConnection>(response)
    },
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: registryKeys.all }),
        queryClient.invalidateQueries({ queryKey: registryKeys.byId(updated.id) }),
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

      return handleApiResponse<RegistryConnection>(response)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: registryKeys.all })
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

      const payload = await readJson<ApiResponse<null>>(response)

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Delete failed")
      }

      return id
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: registryKeys.all })
    },
  })
}
