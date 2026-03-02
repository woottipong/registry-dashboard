import { describe, it, expect, vi, afterEach } from "vitest"
import { GenericProvider } from "@/lib/providers/generic-provider"
import { UnsupportedError } from "@/lib/providers/types"
import type { RegistryConnection } from "@/types/registry"

const CONNECTION: RegistryConnection = {
  id: "generic-test",
  name: "Generic Registry",
  url: "http://registry.local:5000",
  provider: "generic",
  authType: "none",
  createdAt: new Date().toISOString(),
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: new Headers(),
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as typeof fetch
}

describe("GenericProvider", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("has type 'generic'", () => {
    expect(new GenericProvider(CONNECTION).type).toBe("generic")
  })

  describe("capabilities()", () => {
    it("reports canDelete and canListCatalog as true", () => {
      const caps = new GenericProvider(CONNECTION).capabilities()
      expect(caps.canDelete).toBe(true)
      expect(caps.canListCatalog).toBe(true)
      expect(caps.canSearch).toBe(false)
    })
  })

  describe("ping()", () => {
    it("returns true on success", async () => {
      global.fetch = mockFetch({})
      expect(await new GenericProvider(CONNECTION).ping()).toBe(true)
    })
  })

  describe("listRepositories()", () => {
    it("maps catalog to Repository[]", async () => {
      global.fetch = mockFetch({ repositories: ["nginx", "library/redis"] })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe("nginx")
      expect(result.items[1].name).toBe("redis")
      expect(result.items[1].fullName).toBe("library/redis")
    })

    it("handles empty catalog", async () => {
      global.fetch = mockFetch({ repositories: [] })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(0)
    })

    it("handles null tags in catalog response", async () => {
      global.fetch = mockFetch({ repositories: null })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(0)
    })
  })

  describe("listTags()", () => {
    it("maps tags list response", async () => {
      global.fetch = mockFetch({ name: "nginx", tags: ["latest", "1.25", "alpine"] })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items).toHaveLength(3)
      expect(result.items[0].name).toBe("latest")
    })

    it("handles null tags", async () => {
      global.fetch = mockFetch({ name: "nginx", tags: null })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items).toHaveLength(0)
    })
  })

  describe("searchRepositories()", () => {
    it("throws UnsupportedError", async () => {
      const provider = new GenericProvider(CONNECTION)
      await expect(provider.searchRepositories("nginx")).rejects.toThrow(UnsupportedError)
    })
  })

  describe("deleteManifest()", () => {
    it("sends DELETE request", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: "No Content",
        headers: new Headers(),
        text: () => Promise.resolve(""),
      })
      global.fetch = fetchSpy as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      await provider.deleteManifest("nginx", "sha256:abc123")

      const call = fetchSpy.mock.calls[0]
      expect((call[0] as string)).toContain("sha256:abc123")
      expect(call[1].method).toBe("DELETE")
    })
  })
})
