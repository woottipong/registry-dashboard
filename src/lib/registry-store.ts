import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import { z } from "zod"
import { config } from "@/lib/config"
import { decryptCredential, encryptCredential } from "@/lib/crypto"
import type { RegistryConnection } from "@/types/registry"

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

const registryInputSchema = z.object({
  name: z.string().min(1),
  url: z
    .string()
    .url()
    .refine(
      (url) => {
        try {
          return ALLOWED_PROTOCOLS.has(new URL(url).protocol)
        } catch {
          return false
        }
      },
      { message: "Registry URL must use http:// or https://" },
    ),
  provider: z.enum(["generic", "dockerhub"]).optional(),
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

// ---------------------------------------------------------------------------
// Atomic write: back up the current file then swap in via rename (POSIX atomic)
// ---------------------------------------------------------------------------
function atomicWrite(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`)
  }
  const tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, content, "utf-8")
  fs.renameSync(tmpPath, filePath)
}

// Safe read: falls back to the .bak file if the main file is corrupt/missing
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8")
  } catch {
    try {
      return fs.readFileSync(`${filePath}.bak`, "utf-8")
    } catch {
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Credential encryption helpers
// ---------------------------------------------------------------------------
type Credentials = RegistryConnection["credentials"]

function encryptCredentials(creds: Credentials): Credentials {
  if (!creds) return creds
  return {
    username: creds.username,
    password: creds.password ? encryptCredential(creds.password) : undefined,
    token: creds.token ? encryptCredential(creds.token) : undefined,
  }
}

function decryptCredentials(creds: Credentials): Credentials {
  if (!creds) return creds
  return {
    username: creds.username,
    password: creds.password ? decryptCredential(creds.password) : undefined,
    token: creds.token ? decryptCredential(creds.token) : undefined,
  }
}

// ---------------------------------------------------------------------------
// Store read / write
// ---------------------------------------------------------------------------
function readStore(): Map<string, RegistryConnection> {
  const storePath = getStorePath()
  const raw = safeReadFile(storePath)
  if (!raw) return new Map()

  try {
    const parsed = JSON.parse(raw) as RegistryConnection[]
    return new Map(
      parsed.map((r) => [r.id, { ...r, credentials: decryptCredentials(r.credentials) }]),
    )
  } catch {
    console.error("[registry-store] Failed to parse store, starting fresh")
    return new Map()
  }
}

function writeStore(registries: Map<string, RegistryConnection>): void {
  ensureDataDir()
  const storePath = getStorePath()
  const encrypted = Array.from(registries.values()).map((r) => ({
    ...r,
    credentials: encryptCredentials(r.credentials),
  }))
  atomicWrite(storePath, JSON.stringify(encrypted, null, 2))
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
