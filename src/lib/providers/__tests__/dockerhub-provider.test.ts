import { describe, it, expect, vi, afterEach } from "vitest"
import { DockerHubProvider } from "@/lib/providers/dockerhub-provider"
import { UnsupportedError } from "@/lib/providers/types"
import type { RegistryConnection } from "@/types/registry"

// ── Fixtures ──────────────────────────────────────────────────────────────────

const CONNECTION_NO_CREDS: RegistryConnection = {
  id: "dockerhub-test",
  name: "Docker Hub",
  url: "https://registry-1.docker.io",
  provider: "dockerhub",
  authType: "none",
  createdAt: new Date().toISOString(),
}

const CONNECTION_WITH_CREDS: RegistryConnection = {
  ...CONNECTION_NO_CREDS,
  authType: "basic",
  credentials: { username: "testuser", password: "testpass" },
}

// Minimal JWT with exp 1 hour from now (no real signature needed)
function makeJwt(expOffsetMs = 3600_000): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor((Date.now() + expOffsetMs) / 1000), sub: "testuser" })
  ).toString("base64url")
  return `${header}.${payload}.fakesignature`
}

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    statusText: status < 400 ? "OK" : "Error",
    headers: new Headers(),
    text: () => Promise.resolve(JSON.stringify(body)),
  }) as typeof fetch
}

function mockFetchSequence(...responses: Array<[unknown, number?]>) {
  let call = 0
  return vi.fn().mockImplementation(() => {
    const [body, status = 200] = responses[Math.min(call++, responses.length - 1)]
    return Promise.resolve({
      ok: status < 400,
      status,
      statusText: status < 400 ? "OK" : "Error",
      headers: new Headers(),
      text: () => Promise.resolve(JSON.stringify(body)),
    })
  }) as typeof fetch
}

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

// ── capabilities ──────────────────────────────────────────────────────────────

describe("DockerHubProvider.capabilities()", () => {
  it("reports correct capabilities", () => {
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const caps = provider.capabilities()
    expect(caps.canListCatalog).toBe(false)
    expect(caps.canDelete).toBe(false)
    expect(caps.canSearch).toBe(true)
    expect(caps.hasRateLimit).toBe(true)
  })
})

// ── type ──────────────────────────────────────────────────────────────────────

describe("DockerHubProvider.type", () => {
  it("is 'dockerhub'", () => {
    expect(new DockerHubProvider(CONNECTION_NO_CREDS).type).toBe("dockerhub")
  })
})

// ── deleteManifest ────────────────────────────────────────────────────────────

describe("DockerHubProvider.deleteManifest()", () => {
  it("throws UnsupportedError", async () => {
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    await expect(provider.deleteManifest("library/nginx", "sha256:abc")).rejects.toThrow(UnsupportedError)
  })

  it("error message mentions Docker Hub", async () => {
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    await expect(provider.deleteManifest("library/nginx", "sha256:abc")).rejects.toThrow(
      /Docker Hub/
    )
  })
})

// ── ping ──────────────────────────────────────────────────────────────────────

describe("DockerHubProvider.ping()", () => {
  it("returns true when authentication succeeds (no credentials = no auth needed)", async () => {
    // No credentials → authenticateHubApi() is a no-op, ping just returns true
    globalThis.fetch = mockFetch({}) // not actually called without creds
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.ping()
    expect(result).toBe(true)
  })

  it("returns false when authentication fails", async () => {
    // With credentials, auth will be attempted and fail
    globalThis.fetch = mockFetch({ message: "Incorrect authentication credentials" }, 401)
    const provider = new DockerHubProvider(CONNECTION_WITH_CREDS)
    const result = await provider.ping()
    expect(result).toBe(false)
  })
})

// ── listNamespaces ────────────────────────────────────────────────────────────

describe("DockerHubProvider.listNamespaces()", () => {
  it("returns namespace with repository count (no credentials)", async () => {
    globalThis.fetch = mockFetch({
      count: 42,
      results: [],
    })
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toHaveLength(1)
    expect(namespaces[0].repositoryCount).toBe(42)
  })

  it("uses 'library' as default namespace when no credentials or namespace configured", async () => {
    globalThis.fetch = mockFetch({ count: 10, results: [] })
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const namespaces = await provider.listNamespaces()

    expect(namespaces[0].name).toBe("library")
  })

  it("uses configured namespace when present", async () => {
    globalThis.fetch = mockFetch({ count: 5, results: [] })
    const conn = { ...CONNECTION_NO_CREDS, namespace: "myorg" }
    const provider = new DockerHubProvider(conn)
    const namespaces = await provider.listNamespaces()

    expect(namespaces[0].name).toBe("myorg")
  })

  it("returns 0 count on API error without throwing", async () => {
    globalThis.fetch = mockFetch({ message: "Not found" }, 404)
    const conn = { ...CONNECTION_NO_CREDS, namespace: "myorg" }
    const provider = new DockerHubProvider(conn)
    const namespaces = await provider.listNamespaces()

    expect(namespaces[0].repositoryCount).toBe(0)
  })
})

// ── listTags ──────────────────────────────────────────────────────────────────

describe("DockerHubProvider.listTags()", () => {
  it("maps tag results correctly", async () => {
    const tagResponse = {
      count: 2,
      results: [
        {
          name: "latest",
          digest: "sha256:abc",
          full_size: 1024,
          last_updated: "2024-01-01T00:00:00Z",
          images: [{ architecture: "amd64", os: "linux" }],
        },
        {
          name: "v1.0",
          digest: "sha256:def",
          full_size: 2048,
          last_updated: "2024-01-02T00:00:00Z",
          images: [{ architecture: "arm64", os: "linux" }],
        },
      ],
      next: null,
    }

    globalThis.fetch = mockFetch(tagResponse)
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.listTags("library/nginx")

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({
      name: "latest",
      digest: "sha256:abc",
      size: 1024,
      architecture: "amd64",
      os: "linux",
    })
    expect(result.items[1]).toMatchObject({
      name: "v1.0",
      architecture: "arm64",
    })
  })

  it("returns total count from response", async () => {
    globalThis.fetch = mockFetch({ count: 150, results: [], next: null })
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.listTags("library/nginx", { page: 1, perPage: 25 })

    expect(result.total).toBe(150)
    expect(result.page).toBe(1)
    expect(result.perPage).toBe(25)
  })

  it("uses defaults for unknown architecture/os", async () => {
    globalThis.fetch = mockFetch({
      count: 1,
      results: [{ name: "nightly", digest: "sha256:ghi", full_size: 512, last_updated: null, images: [] }],
      next: null,
    })
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.listTags("library/nginx")

    expect(result.items[0].architecture).toBe("unknown")
    expect(result.items[0].os).toBe("unknown")
  })
})

// ── searchRepositories ────────────────────────────────────────────────────────

describe("DockerHubProvider.searchRepositories()", () => {
  it("maps search results to Repository objects", async () => {
    globalThis.fetch = mockFetch({
      count: 1,
      results: [
        {
          name: "nginx",
          namespace: "library",
          description: "Official Nginx image",
          is_official: true,
          is_private: false,
          star_count: 100,
          pull_count: 1000000,
          last_updated: "2024-01-01T00:00:00Z",
        },
      ],
      next: null,
    })

    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.searchRepositories("nginx")

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      name: "nginx",
      namespace: "library",
      fullName: "library/nginx",
      description: "Official Nginx image",
      isOfficial: true,
      starCount: 100,
    })
  })

  it("throws when search API fails", async () => {
    globalThis.fetch = mockFetch({ message: "Service unavailable" }, 503)
    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    await expect(provider.searchRepositories("nginx")).rejects.toThrow()
  })
})

// ── authenticate with credentials ─────────────────────────────────────────────

describe("DockerHubProvider authentication", () => {
  it("authenticates with credentials and caches token", async () => {
    const jwt = makeJwt()
    // Sequence: login → verify → listNamespaces
    globalThis.fetch = mockFetchSequence(
      [{ token: jwt }],                  // login
      [{ count: 1, results: [] }],       // verifyAuthentication
      [{ count: 5, results: [] }],       // listNamespaces
    )

    const provider = new DockerHubProvider(CONNECTION_WITH_CREDS)
    const namespaces = await provider.listNamespaces()

    expect(namespaces[0].name).toBe("testuser") // authenticated username becomes namespace
  })

  it("skips authentication when no credentials provided", async () => {
    const fetchSpy = mockFetch({ count: 3, results: [] })
    globalThis.fetch = fetchSpy

    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    await provider.listNamespaces()

    // Only one fetch call (listNamespaces itself), no auth call
    const calls = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls
    expect(calls.length).toBe(1)
  })

  it("throws descriptive error when login fails", async () => {
    globalThis.fetch = mockFetch({ message: "Incorrect authentication" }, 401)
    const provider = new DockerHubProvider(CONNECTION_WITH_CREDS)

    await expect(provider.listNamespaces()).rejects.toThrow(/Docker Hub authentication failed/)
  })

  it("rejects invalid authentication payloads", async () => {
    globalThis.fetch = mockFetch({ token: "" })
    const provider = new DockerHubProvider(CONNECTION_WITH_CREDS)

    await expect(provider.listNamespaces()).rejects.toThrow(/Docker Hub authentication failed/)
  })
})

// ── listRepositories ──────────────────────────────────────────────────────────

describe("DockerHubProvider.listRepositories()", () => {
  it("returns all repositories fetched from Hub API", async () => {
    globalThis.fetch = mockFetch({
      count: 2,
      results: [
        { name: "nginx", namespace: "library", is_official: true, star_count: 100 },
        { name: "redis", namespace: "library", is_official: true, star_count: 50 },
      ],
      next: null,
    })

    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.listRepositories()

    expect(result.items).toHaveLength(2)
    expect(result.items[0].name).toBe("nginx")
    expect(result.items[1].name).toBe("redis")
  })

  it("fetches multiple pages when next is present", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({
          count: 2,
          results: [{ name: "nginx", namespace: "library" }],
          next: "https://hub.docker.com/v2/repositories/library/?page=2",
        })),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({
          count: 2,
          results: [{ name: "redis", namespace: "library" }],
          next: null,
        })),
      }) as typeof fetch

    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    const result = await provider.listRepositories()

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(2)
  })

  it("rejects invalid repository payloads", async () => {
    globalThis.fetch = mockFetch({
      count: "bad",
      results: [],
      next: null,
    })

    const provider = new DockerHubProvider(CONNECTION_NO_CREDS)
    await expect(provider.listRepositories()).rejects.toThrow(/Failed to list repositories/)
  })
})
