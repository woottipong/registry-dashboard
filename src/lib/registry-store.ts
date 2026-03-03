import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import { z } from "zod"
import { config } from "@/lib/config"
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

function getStorePath(): string {
  return path.join(config.DATA_DIR, "registries.json")
}

function ensureDataDir(): void {
  fs.mkdirSync(config.DATA_DIR, { recursive: true })
}

function readStore(): Map<string, RegistryConnection> {
  const storePath = getStorePath()
  try {
    if (!fs.existsSync(storePath)) {
      return new Map()
    }
    const raw = fs.readFileSync(storePath, "utf-8")
    const parsed = JSON.parse(raw) as RegistryConnection[]
    return new Map(parsed.map((r) => [r.id, r]))
  } catch {
    console.error("[registry-store] Failed to read store, starting fresh")
    return new Map()
  }
}

function writeStore(registries: Map<string, RegistryConnection>): void {
  ensureDataDir()
  const storePath = getStorePath()
  const data = JSON.stringify(Array.from(registries.values()), null, 2)
  fs.writeFileSync(storePath, data, "utf-8")
}

export function parseRegistryInput(payload: unknown): RegistryInput {
  return registryInputSchema.parse(payload)
}

export function listRegistries(): RegistryConnection[] {
  return Array.from(readStore().values())
}

export function getRegistry(id: string): RegistryConnection | undefined {
  return readStore().get(id)
}

export function createRegistry(payload: RegistryInput): RegistryConnection {
  const store = readStore()
  const now = new Date().toISOString()
  const id = randomUUID()

  if (payload.isDefault) {
    for (const registry of store.values()) {
      registry.isDefault = false
    }
  }

  const registry: RegistryConnection = {
    id,
    name: payload.name,
    url: payload.url,
    provider: payload.provider ?? "generic",
    authType: payload.authType,
    credentials: payload.credentials,
    namespace: payload.namespace,
    isDefault: payload.isDefault ?? store.size === 0,
    createdAt: now,
    updatedAt: now,
  }

  store.set(id, registry)
  writeStore(store)
  return registry
}

export function updateRegistry(id: string, payload: RegistryInput): RegistryConnection | undefined {
  const store = readStore()
  const existing = store.get(id)
  if (!existing) {
    return undefined
  }

  if (payload.isDefault) {
    for (const registry of store.values()) {
      registry.isDefault = false
    }
  }

  const updated: RegistryConnection = {
    ...existing,
    ...payload,
    id,
    provider: payload.provider ?? existing.provider,
    updatedAt: new Date().toISOString(),
  }

  store.set(id, updated)
  writeStore(store)
  return updated
}

export function deleteRegistry(id: string): boolean {
  const store = readStore()
  const deleted = store.delete(id)
  if (deleted) {
    writeStore(store)
  }
  return deleted
}
