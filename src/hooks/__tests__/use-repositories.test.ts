import React from "react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  makeRepositoryQueryString,
  fetchRepositories,
  useRepositories,
  useSearchRepositories,
  useDeleteRepository,
} from "@/hooks/use-repositories"
import type { Repository } from "@/types/registry"

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const REGISTRY_ID = "reg-1"

const makeRepo = (name: string): Repository => ({
  name,
  fullName: `library/${name}`,
  namespace: "library",
  tagCount: 3,
})

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

// ── makeRepositoryQueryString ─────────────────────────────────────────────────

describe("makeRepositoryQueryString", () => {
  it("returns empty string when no options", () => {
    expect(makeRepositoryQueryString({})).toBe("")
  })

  it("includes page and perPage", () => {
    const qs = makeRepositoryQueryString({ page: 2, perPage: 50 })
    expect(qs).toBe("?page=2&perPage=50")
  })

  it("includes search", () => {
    const qs = makeRepositoryQueryString({ search: "nginx" })
    expect(qs).toContain("search=nginx")
  })

  it("includes namespace even when empty string (root)", () => {
    const qs = makeRepositoryQueryString({ namespace: "" })
    expect(qs).toContain("namespace=")
  })

  it("omits namespace when undefined", () => {
    const qs = makeRepositoryQueryString({ namespace: undefined })
    expect(qs).not.toContain("namespace")
  })

  it("combines all options", () => {
    const qs = makeRepositoryQueryString({ page: 1, perPage: 25, search: "web", namespace: "myorg" })
    expect(qs).toContain("page=1")
    expect(qs).toContain("perPage=25")
    expect(qs).toContain("search=web")
    expect(qs).toContain("namespace=myorg")
  })
})

// ── fetchRepositories ─────────────────────────────────────────────────────────

describe("fetchRepositories", () => {
  it("returns items and meta on success", async () => {
    const repos = [makeRepo("nginx"), makeRepo("redis")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: repos }),
    }) as typeof fetch

    const result = await fetchRepositories(REGISTRY_ID, { page: 1, perPage: 25 })

    expect(result.items).toEqual(repos)
    expect(result.meta).toMatchObject({ page: 1, perPage: 25 })
  })

  it("uses meta from response when provided", async () => {
    const repos = [makeRepo("nginx")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: repos,
        meta: { page: 2, perPage: 25, total: 100, totalPages: 4 },
      }),
    }) as typeof fetch

    const result = await fetchRepositories(REGISTRY_ID, { page: 2, perPage: 25 })

    expect(result.meta).toMatchObject({ page: 2, total: 100, totalPages: 4 })
  })

  it("throws error message from response when present", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ errors: [{ message: "Not found" }] }),
    }) as typeof fetch

    await expect(fetchRepositories(REGISTRY_ID, {})).rejects.toThrow("Not found")
  })

  it("throws generic message when no error detail in response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as typeof fetch

    await expect(fetchRepositories(REGISTRY_ID, {})).rejects.toThrow("Unable to fetch repositories")
  })
})

// ── useRepositories ───────────────────────────────────────────────────────────

describe("useRepositories", () => {
  it("fetches repositories when namespace is defined", async () => {
    const repos = [makeRepo("nginx")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: repos }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useRepositories(REGISTRY_ID, { namespace: "library" }),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toEqual(repos)
  })

  it("is disabled when namespace is undefined", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useRepositories(REGISTRY_ID, { namespace: undefined }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is disabled when registryId is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useRepositories("", { namespace: "library" }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is disabled when caller passes enabled: false", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useRepositories(REGISTRY_ID, { namespace: "library", enabled: false }),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ── useSearchRepositories ─────────────────────────────────────────────────────

describe("useSearchRepositories", () => {
  it("fetches when query is non-empty", async () => {
    const repos = [makeRepo("nginx")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: repos }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useSearchRepositories(REGISTRY_ID, "nginx"),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toEqual(repos)
  })

  it("is disabled when query is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useSearchRepositories(REGISTRY_ID, ""),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is disabled when query is only whitespace", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useSearchRepositories(REGISTRY_ID, "   "),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("sends search param to API", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(
      () => useSearchRepositories(REGISTRY_ID, "web"),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const calledUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(calledUrl).toContain("search=web")
  })
})

// ── useDeleteRepository ───────────────────────────────────────────────────────

describe("useDeleteRepository", () => {
  it("sends DELETE to the correct URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRepository(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repositoryName: "library/nginx" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const calledUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(calledUrl).toBe(`/api/v1/registries/${REGISTRY_ID}/repositories/library/nginx`)
    expect((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][1].method).toBe("DELETE")
  })

  it("encodes slashes in repository name", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRepository(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repositoryName: "my org/web app" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const calledUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(calledUrl).toContain("my%20org/web%20app")
  })

  it("throws when API returns error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Not found" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRepository(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repositoryName: "nginx" })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toContain("Not found")
  })

  it("invalidates repository queries on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useDeleteRepository(), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repositoryName: "nginx" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["repositories", REGISTRY_ID] })
    )
  })
})
