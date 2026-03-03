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

// Multi-route mock: catalog returns repo names (no Link header), tags return tag list
function mockFetchCatalogAndTags(repoNames: string[], tags: string[] = ["latest"]) {
  return vi.fn().mockImplementation((url: string) => {
    const urlStr = String(url)
    if (urlStr.includes("_catalog")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(), // no Link header → single page
        text: () => Promise.resolve(JSON.stringify({ repositories: repoNames })),
      })
    }
    // tags/list endpoint
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify({ name: "repo", tags })),
    })
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
      global.fetch = mockFetchCatalogAndTags(["nginx", "library/redis"])

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(2)
      expect(result.items[0].name).toBe("nginx")
      expect(result.items[1].name).toBe("redis")
      expect(result.items[1].fullName).toBe("library/redis")
    })

    it("handles empty catalog", async () => {
      global.fetch = mockFetchCatalogAndTags([])

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(0)
    })

    it("handles null repositories in catalog response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ repositories: null })),
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(0)
    })

    it("skips repos with no tags", async () => {
      global.fetch = mockFetchCatalogAndTags(["nginx", "empty-repo"], [])

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.items).toHaveLength(0)
    })

    it("returns correct total and pagination", async () => {
      global.fetch = mockFetchCatalogAndTags(["a", "b", "c"])

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories({ page: 1, perPage: 2 })

      expect(result.total).toBe(3)
      expect(result.items).toHaveLength(2)
      expect(result.page).toBe(1)
      expect(result.perPage).toBe(2)
    })
  })

  describe("listTags()", () => {
    it("handles null tags", async () => {
      global.fetch = mockFetch({ name: "nginx", tags: null })

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items).toHaveLength(0)
    })

    it("resolves digest from Docker-Content-Digest header when body has none", async () => {
      const digest = "sha256:deadbeef"
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("tags/list")) {
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ name: "nginx", tags: ["latest"] })),
          })
        }
        // manifest fetch — returns schema v2 single manifest, digest in header only
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ "Docker-Content-Digest": digest }),
          text: () => Promise.resolve(JSON.stringify({
            schemaVersion: 2,
            mediaType: "application/vnd.docker.distribution.manifest.v2+json",
            config: { mediaType: "application/vnd.docker.container.image.v1+json", size: 1234, digest: "sha256:cfgdigest" },
            layers: [{ mediaType: "application/vnd.docker.image.rootfs.diff.tar.gzip", size: 5000, digest: "sha256:layer1" }],
          })),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items[0].digest).toBe(digest)
      expect(result.items[0].size).toBe(1234 + 5000)
    })

    it("resolves digest from body when present", async () => {
      const digest = "sha256:fromBody"
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("tags/list")) {
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ name: "nginx", tags: ["v1"] })),
          })
        }
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          text: () => Promise.resolve(JSON.stringify({
            schemaVersion: 2,
            mediaType: "application/vnd.docker.distribution.manifest.v2+json",
            digest,
            config: { mediaType: "application/vnd.docker.container.image.v1+json", size: 100, digest: "sha256:cfg" },
            layers: [{ mediaType: "application/vnd.docker.image.rootfs.diff.tar.gzip", size: 200, digest: "sha256:l1" }],
          })),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items[0].digest).toBe(digest)
    })

    it("handles OCI image index (multi-arch) — aggregates size and reads first platform", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("tags/list")) {
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ name: "app", tags: ["latest"] })),
          })
        }
        if (u.includes("manifests/latest")) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ "Docker-Content-Digest": "sha256:indexdigest" }),
            text: () => Promise.resolve(JSON.stringify({
              schemaVersion: 2,
              mediaType: "application/vnd.oci.image.index.v1+json",
              manifests: [
                { mediaType: "application/vnd.oci.image.manifest.v1+json", size: 1000, digest: "sha256:amd64", platform: { architecture: "amd64", os: "linux" } },
                { mediaType: "application/vnd.oci.image.manifest.v1+json", size: 900, digest: "sha256:arm64", platform: { architecture: "arm64", os: "linux" } },
              ],
            })),
          })
        }
        // child manifest fetch (for created date)
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          text: () => Promise.resolve(JSON.stringify({
            schemaVersion: 2,
            mediaType: "application/vnd.oci.image.manifest.v1+json",
            config: { size: 500, digest: "sha256:childcfg" },
            layers: [],
          })),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("app")

      expect(result.items).toHaveLength(1)
      expect(result.items[0].digest).toBe("sha256:indexdigest")
      expect(result.items[0].size).toBe(1900) // 1000 + 900
      expect(result.items[0].architecture).toBe("amd64")
      expect(result.items[0].os).toBe("linux")
    })

    it("handles docker manifest list (multi-arch) mediaType", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("tags/list")) {
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ name: "app", tags: ["stable"] })),
          })
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ "Docker-Content-Digest": "sha256:listdigest" }),
          text: () => Promise.resolve(JSON.stringify({
            schemaVersion: 2,
            mediaType: "application/vnd.docker.distribution.manifest.list.v2+json",
            manifests: [
              { mediaType: "application/vnd.docker.distribution.manifest.v2+json", size: 500, digest: "sha256:child1", platform: { architecture: "amd64", os: "linux" } },
            ],
          })),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("app")

      expect(result.items[0].digest).toBe("sha256:listdigest")
      expect(result.items[0].architecture).toBe("amd64")
    })

    it("falls back to empty tag when manifest fetch fails", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("tags/list")) {
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ name: "nginx", tags: ["broken"] })),
          })
        }
        return Promise.resolve({
          ok: false, status: 500, statusText: "Internal Server Error",
          headers: new Headers(),
          text: () => Promise.resolve("{}"),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listTags("nginx")

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe("broken")
      expect(result.items[0].digest).toBe("")
      expect(result.items[0].size).toBe(0)
      expect(result.items[0].architecture).toBe("unknown")
    })
  })

  describe("listRepositories() — Link header pagination", () => {
    it("follows Link header to fetch all catalog pages", async () => {
      let callCount = 0
      global.fetch = vi.fn().mockImplementation((url: string) => {
        const u = String(url)
        if (u.includes("_catalog")) {
          callCount++
          if (callCount === 1) {
            // First page — has Link next header
            return Promise.resolve({
              ok: true, status: 200,
              headers: new Headers({ link: '</v2/_catalog?last=a&n=1000>; rel="next"' }),
              text: () => Promise.resolve(JSON.stringify({ repositories: ["repo-a"] })),
            })
          }
          // Second page — no Link header
          return Promise.resolve({
            ok: true, status: 200, headers: new Headers(),
            text: () => Promise.resolve(JSON.stringify({ repositories: ["repo-b"] })),
          })
        }
        // tags/list for both repos
        return Promise.resolve({
          ok: true, status: 200, headers: new Headers(),
          text: () => Promise.resolve(JSON.stringify({ name: "repo", tags: ["latest"] })),
        })
      }) as typeof fetch

      const provider = new GenericProvider(CONNECTION)
      const result = await provider.listRepositories()

      expect(result.total).toBe(2)
      expect(result.items.map((r) => r.fullName)).toContain("repo-a")
      expect(result.items.map((r) => r.fullName)).toContain("repo-b")
      expect(callCount).toBe(2) // exactly 2 catalog fetches
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
