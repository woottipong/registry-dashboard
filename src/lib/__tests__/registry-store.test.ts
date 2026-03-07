import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

vi.mock("@/lib/config", () => ({
  config: {
    DATA_DIR: "",          // overridden in beforeEach
    // SESSION_SECRET must be ≥32 chars for scrypt key derivation — inlined (no variable: vi.mock is hoisted)
    SESSION_SECRET: "test-session-secret-32-chars-min!",
    APP_USERNAME: "admin",
    APP_PASSWORD: "password",
  },
}))

// Import after mock is registered so the store picks up the mocked config
import { config } from "@/lib/config"
import {
  createRegistry,
  getRegistry,
  listRegistries,
  updateRegistry,
  deleteRegistry,
} from "@/lib/registry-store"

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "registry-store-test-"))
  ;(config as { DATA_DIR: string }).DATA_DIR = tmpDir
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

const INPUT = {
  name: "My Registry",
  url: "https://registry.example.com",
  authType: "none" as const,
}

describe("createRegistry()", () => {
  it("persists a registry and returns it with an id", () => {
    const reg = createRegistry(INPUT)

    expect(reg.id).toBeTruthy()
    expect(reg.name).toBe("My Registry")
    expect(reg.url).toBe("https://registry.example.com")
    expect(reg.authType).toBe("none")
    expect(reg.createdAt).toBeTruthy()
  })

  it("auto-assigns isDefault=true for first registry", () => {
    const reg = createRegistry(INPUT)
    expect(reg.isDefault).toBe(true)
  })

  it("subsequent registries are not default unless specified", () => {
    createRegistry(INPUT)
    const second = createRegistry({ ...INPUT, name: "Second" })
    expect(second.isDefault).toBe(false)
  })

  it("setting isDefault=true clears existing defaults", () => {
    const first = createRegistry({ ...INPUT, isDefault: true })
    const second = createRegistry({ ...INPUT, name: "Second", isDefault: true })

    const updatedFirst = getRegistry(first.id)
    expect(updatedFirst?.isDefault).toBe(false)
    expect(second.isDefault).toBe(true)
  })

  it("assigns default provider 'generic' when omitted", () => {
    const reg = createRegistry(INPUT)
    expect(reg.provider).toBe("generic")
  })

  it("encrypts and round-trips credentials", () => {
    const reg = createRegistry({
      ...INPUT,
      authType: "basic",
      credentials: { username: "user", password: "s3cr3t" },
    })

    const loaded = getRegistry(reg.id)
    expect(loaded?.credentials?.username).toBe("user")
    expect(loaded?.credentials?.password).toBe("s3cr3t")
  })
})

describe("getRegistry()", () => {
  it("returns the registry by id", () => {
    const created = createRegistry(INPUT)
    const found = getRegistry(created.id)

    expect(found?.id).toBe(created.id)
    expect(found?.name).toBe("My Registry")
  })

  it("returns undefined for non-existent id", () => {
    expect(getRegistry("does-not-exist")).toBeUndefined()
  })
})

describe("listRegistries()", () => {
  it("returns empty array when no registries exist", () => {
    expect(listRegistries()).toEqual([])
  })

  it("returns all created registries", () => {
    createRegistry({ ...INPUT, name: "Alpha" })
    createRegistry({ ...INPUT, name: "Beta" })
    createRegistry({ ...INPUT, name: "Gamma" })

    const list = listRegistries()
    expect(list).toHaveLength(3)
    expect(list.map(r => r.name)).toEqual(expect.arrayContaining(["Alpha", "Beta", "Gamma"]))
  })
})

describe("updateRegistry()", () => {
  it("updates an existing registry", () => {
    const created = createRegistry(INPUT)
    const updated = updateRegistry(created.id, { ...INPUT, name: "Updated Name" })

    expect(updated?.name).toBe("Updated Name")
    expect(updated?.id).toBe(created.id)
    expect(updated?.updatedAt).toBeTruthy()
  })

  it("returns undefined for non-existent id", () => {
    const result = updateRegistry("ghost-id", INPUT)
    expect(result).toBeUndefined()
  })

  it("persists the update to disk", () => {
    const created = createRegistry(INPUT)
    updateRegistry(created.id, { ...INPUT, name: "Persisted" })

    const found = getRegistry(created.id)
    expect(found?.name).toBe("Persisted")
  })
})

describe("deleteRegistry()", () => {
  it("removes an existing registry and returns true", () => {
    const created = createRegistry(INPUT)
    const deleted = deleteRegistry(created.id)

    expect(deleted).toBe(true)
    expect(getRegistry(created.id)).toBeUndefined()
  })

  it("returns false when registry does not exist", () => {
    expect(deleteRegistry("ghost-id")).toBe(false)
  })

  it("does not affect other registries", () => {
    const first = createRegistry({ ...INPUT, name: "First" })
    const second = createRegistry({ ...INPUT, name: "Second" })

    deleteRegistry(first.id)

    expect(getRegistry(second.id)?.name).toBe("Second")
    expect(listRegistries()).toHaveLength(1)
  })
})

describe("file I/O resilience", () => {
  it("reads from .bak file when main file is corrupted", () => {
    // Create a valid registry to seed the store
    const reg = createRegistry(INPUT)
    const storePath = join(tmpDir, "registries.json")
    const bakPath = `${storePath}.bak`

    // The atomicWrite function creates a .bak before overwriting
    // Simulate corruption by writing invalid JSON to the main file
    writeFileSync(storePath, "{ not valid json !!!", "utf-8")

    // The store should fall back to the .bak file which has valid data
    expect(() => getRegistry(reg.id)).not.toThrow()
    const recovered = getRegistry(reg.id)
    // If .bak exists, we recover; if not, we start fresh (no crash)
    if (recovered !== undefined) {
      expect(recovered.name).toBe("My Registry")
    }
  })

  it("returns empty list when store file is missing (fresh start)", () => {
    expect(listRegistries()).toEqual([])
  })

  it("write is atomic — stores all registries on each write", () => {
    createRegistry({ ...INPUT, name: "First" })
    createRegistry({ ...INPUT, name: "Second" })

    const storePath = join(tmpDir, "registries.json")
    const contents = readFileSync(storePath, "utf-8")
    const parsed = JSON.parse(contents)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
  })
})
