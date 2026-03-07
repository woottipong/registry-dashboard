import { describe, it, expect, vi, afterEach } from "vitest"
import { GenericProvider } from "@/lib/providers/generic-provider"
import type { RegistryConnection } from "@/types/registry"

const BASE: RegistryConnection = {
  id: "test",
  name: "Test",
  url: "http://registry.test",
  provider: "generic",
  authType: "none",
  createdAt: new Date().toISOString(),
}

// Reuse the mockFetch helper style from registry-client.test.ts
interface MockResponse {
  ok?: boolean
  status?: number
  body?: string
  headers?: Record<string, string>
}

function mockFetch(responses: MockResponse[]) {
  let callIndex = 0
  return vi.fn().mockImplementation(() => {
    const r = responses[Math.min(callIndex++, responses.length - 1)]
    const headers = new Headers(r.headers ?? {})
    const bodyText = r.body ?? "{}"
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      headers,
      text: () => Promise.resolve(bodyText),
      json: () => Promise.resolve(JSON.parse(bodyText)),
    })
  })
}

describe("GenericProvider.listNamespaces()", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("groups repos by namespace prefix", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({ repositories: ["app/web", "app/api", "nginx"] }) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toEqual(
      expect.arrayContaining([
        { name: "app", repositoryCount: 2 },
        { name: "", repositoryCount: 1 },
      ])
    )
  })

  it("returns root namespace '' for repos with no path separator", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({ repositories: ["nginx", "redis", "postgres"] }) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toHaveLength(1)
    expect(namespaces[0]).toEqual({ name: "", repositoryCount: 3 })
  })

  it("handles deeply nested repo paths — uses all but last segment as namespace", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({ repositories: ["org/team/service", "org/team/worker"] }) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toHaveLength(1)
    expect(namespaces[0]).toEqual({ name: "org/team", repositoryCount: 2 })
  })

  it("returns empty array for empty registry", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({ repositories: [] }) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toEqual([])
  })

  it("returns empty array when catalog has no repositories key", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({}) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(namespaces).toEqual([])
  })

  it("makes exactly 1 catalog request — no N+1 tag fetches", async () => {
    const fetchSpy = mockFetch([
      { body: JSON.stringify({ repositories: ["app/web", "app/api", "nginx"] }) },
    ])
    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    await provider.listNamespaces()

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it("sorts namespaces alphabetically", async () => {
    global.fetch = mockFetch([
      { body: JSON.stringify({ repositories: ["zebra/svc", "alpha/svc", "mango/svc", "root-app"] }) },
    ]) as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    const names = namespaces.map(n => n.name)
    expect(names).toEqual(["", "alpha", "mango", "zebra"])
  })

  it("follows Link header for paginated catalog", async () => {
    // First page returns repos + Link header; second page returns remaining repos
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ link: '</v2/_catalog?last=app/web&n=1000>; rel="next"' }),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["app/web"] })),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({}),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["nginx"] })),
      })

    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    const namespaces = await provider.listNamespaces()

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(namespaces).toEqual(
      expect.arrayContaining([
        { name: "app", repositoryCount: 1 },
        { name: "", repositoryCount: 1 },
      ])
    )
  })
})

describe("GenericProvider.listRepositories()", () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("filters repos by namespace", async () => {
    const fetchSpy = vi.fn()
      // catalog fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["app/web", "app/api", "nginx"] })),
      })
      // tag-list for app/web
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "app/web", tags: ["latest", "v1"] })),
      })
      // tag-list for app/api
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "app/api", tags: ["stable"] })),
      })

    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    const result = await provider.listRepositories({ namespace: "app" })

    expect(result.items).toHaveLength(2)
    expect(result.items.map(r => r.fullName)).toEqual(
      expect.arrayContaining(["app/web", "app/api"])
    )
    // nginx should be excluded (wrong namespace)
    expect(result.items.find(r => r.fullName === "nginx")).toBeUndefined()
  })

  it("returns root-level repos for namespace ''", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["nginx", "app/web"] })),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "nginx", tags: ["latest"] })),
      })

    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    const result = await provider.listRepositories({ namespace: "" })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].fullName).toBe("nginx")
  })

  it("excludes repos with empty tag list", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["app/web", "app/empty"] })),
      })
      // app/web has tags
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "app/web", tags: ["latest"] })),
      })
      // app/empty has no tags
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "app/empty", tags: [] })),
      })

    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    const result = await provider.listRepositories({ namespace: "app" })

    expect(result.items).toHaveLength(1)
    expect(result.items[0].fullName).toBe("app/web")
    expect(result.items[0].tagCount).toBe(1)
  })

  it("sets correct namespace, name, and fullName on returned repos", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ repositories: ["team/backend/api"] })),
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        headers: new Headers(),
        text: () => Promise.resolve(JSON.stringify({ name: "team/backend/api", tags: ["v2"] })),
      })

    global.fetch = fetchSpy as typeof fetch

    const provider = new GenericProvider(BASE)
    const result = await provider.listRepositories({ namespace: "team/backend" })

    expect(result.items).toHaveLength(1)
    const repo = result.items[0]
    expect(repo.fullName).toBe("team/backend/api")
    expect(repo.name).toBe("api")
    expect(repo.namespace).toBe("team/backend")
    expect(repo.tagCount).toBe(1)
  })
})
