import { randomUUID } from "crypto"
import { z } from "zod"
import type { RegistryConnection } from "@/types/registry"

const registryInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  provider: z.enum(["generic", "dockerhub", "ghcr", "ecr", "gcr", "acr"]).optional(),
  authType: z.enum(["none", "basic", "bearer"]).default("none"),
  credentials: z
    .object({
      username: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
    })
    .optional(),
  namespace: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export type RegistryInput = z.infer<typeof registryInputSchema>

const registries = new Map<string, RegistryConnection>()

export function parseRegistryInput(payload: unknown): RegistryInput {
  return registryInputSchema.parse(payload)
}

export function listRegistries(): RegistryConnection[] {
  return Array.from(registries.values())
}

export function getRegistry(id: string): RegistryConnection | undefined {
  return registries.get(id)
}

export function createRegistry(payload: RegistryInput): RegistryConnection {
  const now = new Date().toISOString()
  const id = randomUUID()

  const registry: RegistryConnection = {
    id,
    name: payload.name,
    url: payload.url,
    provider: payload.provider ?? "generic",
    authType: payload.authType,
    credentials: payload.credentials,
    namespace: payload.namespace,
    isDefault: payload.isDefault ?? false,
    createdAt: now,
    updatedAt: now,
  }

  registries.set(id, registry)
  return registry
}

export function updateRegistry(id: string, payload: RegistryInput): RegistryConnection | undefined {
  const existing = registries.get(id)
  if (!existing) {
    return undefined
  }

  const updated: RegistryConnection = {
    ...existing,
    ...payload,
    provider: payload.provider ?? existing.provider,
    updatedAt: new Date().toISOString(),
  }

  registries.set(id, updated)
  return updated
}

export function deleteRegistry(id: string): boolean {
  return registries.delete(id)
}
