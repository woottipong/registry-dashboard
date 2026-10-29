import { randomUUID } from "crypto"
import { isIP } from "net"
import path from "path"
import * as z from "zod"
import { AtomicJsonStore } from "@/lib/atomic-file-store"
import { config } from "@/lib/config"
import { decryptCredential, encryptCredential } from "@/lib/crypto"
import type { RegistryConnection } from "@/types/registry"

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"])

function isBlockedRegistryHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase()

  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized === "0.0.0.0" ||
    normalized === "::" ||
    // Docker resolves this alias to the host machine, so treating it as internal-only
    // prevents the dashboard from proxying requests back into the host network.
    normalized === "host.docker.internal"
  ) {
    return true
  }

  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number)

    if (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true
    }
  }

  if (isIP(normalized) === 6) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    )
  }

  return false
}

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
}).superRefine((data, ctx) => {
  if (data.authType === "basic") {
    if (!data.credentials?.username || !data.credentials?.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Basic auth requires username and password",
        path: ["credentials"],
      })
    }
  }
  if (data.authType === "bearer") {
    if (!data.credentials?.token && !data.credentials?.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bearer auth requires a token or password",
        path: ["credentials"],
      })
    }
  }

  try {
    const hostname = new URL(data.url).hostname
    if (isBlockedRegistryHostname(hostname)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Registry URL must not target loopback, link-local, or private network addresses",
        path: ["url"],
      })
    }
  } catch {
    // URL format is already validated above
  }
})

export type RegistryInput = z.infer<typeof registryInputSchema>

const fileStore = new AtomicJsonStore<RegistryConnection[]>(
  () => path.join(config.DATA_DIR, "registries.json"),
  () => [],
  "[registry-store]",
)

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
  const records = fileStore.read()
  return new Map(
    records.map((r) => [r.id, { ...r, credentials: decryptCredentials(r.credentials) }]),
  )
}

function writeStore(registries: Map<string, RegistryConnection>): void {
  const encrypted = Array.from(registries.values()).map((r) => ({
    ...r,
    credentials: encryptCredentials(r.credentials),
  }))
  fileStore.write(encrypted)
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

export function setDefaultRegistry(id: string): RegistryConnection | undefined {
  const store = readStore()
  const existing = store.get(id)
  if (!existing) {
    return undefined
  }

  for (const registry of store.values()) {
    registry.isDefault = registry.id === id
    if (registry.id === id) {
      registry.updatedAt = new Date().toISOString()
    }
  }

  writeStore(store)
  return store.get(id)
}

export function deleteRegistry(id: string): boolean {
  const store = readStore()
  const deleted = store.delete(id)
  if (deleted) {
    writeStore(store)
  }
  return deleted
}
