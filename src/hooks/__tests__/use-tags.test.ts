import React from "react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useTags, useDeleteTag, useDeleteTags } from "@/hooks/use-tags"
import type { Tag } from "@/types/registry"

// ── Helpers ──────────────────────────────────────────────────────────────────

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

const makeTag = (name: string, digest = `sha256:${name}abc`): Tag => ({
  name,
  digest,
  size: 1024,
  createdAt: "2024-01-01T00:00:00Z",
  os: "linux",
  architecture: "amd64",
})

const REGISTRY_ID = "reg-1"
const REPO_NAME = "app/web"

// ── Setup / Teardown ─────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

// ── useTags ───────────────────────────────────────────────────────────────────

describe("useTags", () => {
  it("fetches tags and returns items with meta", async () => {
    const tags = [makeTag("v1"), makeTag("v2")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: tags }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useTags(REGISTRY_ID, REPO_NAME, 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.items).toEqual(tags)
    expect(result.current.data?.meta).toMatchObject({ page: 1, perPage: 50 })
  })

  it("uses cache: 'no-store' on fetch", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useTags(REGISTRY_ID, REPO_NAME, 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(init.cache).toBe("no-store")
  })

  it("constructs the correct URL with page and perPage params", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const queryClient = makeQueryClient()
    renderHook(() => useTags(REGISTRY_ID, "app/web", 2, 25), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toContain("/api/v1/registries/reg-1/repositories/app/web/tags")
    expect(url).toContain("page=2")
    expect(url).toContain("perPage=25")
  })

  it("URL-encodes slashes in repo name segments", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const queryClient = makeQueryClient()
    renderHook(() => useTags(REGISTRY_ID, "my%org/app", 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    const [url] = fetchSpy.mock.calls[0] as [string]
    // Each segment is encoded, slashes between segments are kept
    expect(url).toContain("repositories/my%25org/app/tags")
  })

  it("throws when API returns non-ok response with error message", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "internal server error" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useTags(REGISTRY_ID, REPO_NAME, 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe("internal server error")
  })

  it("throws generic error when API response format is unexpected", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useTags(REGISTRY_ID, REPO_NAME, 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe("Unable to fetch tags")
  })

  it("uses meta from API response when present", async () => {
    const meta = { page: 1, perPage: 50, total: 120, totalPages: 3 }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: [], meta }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useTags(REGISTRY_ID, REPO_NAME, 1, 50), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.meta).toEqual(meta)
  })

  it("does not fetch when registryId is empty", () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy as typeof fetch

    const queryClient = makeQueryClient()
    renderHook(() => useTags("", REPO_NAME, 1, 50), { wrapper: makeWrapper(queryClient) })

    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ── useDeleteTag ──────────────────────────────────────────────────────────────

describe("useDeleteTag", () => {
  const QUERY_KEY = ["tags", REGISTRY_ID, REPO_NAME, 1, 50]
  const INITIAL_TAGS = [makeTag("v1", "sha256:aaa"), makeTag("v2", "sha256:bbb")]

  function setup() {
    const queryClient = makeQueryClient()
    queryClient.setQueryData(QUERY_KEY, { items: INITIAL_TAGS, meta: { page: 1, perPage: 50, total: 2, totalPages: 1 } })
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    const wrapper = makeWrapper(queryClient)
    return { queryClient, invalidateSpy, wrapper }
  }

  it("sends DELETE to correct manifest endpoint", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const { wrapper } = setup()
    const { result } = renderHook(() => useDeleteTag(), { wrapper })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repoName: REPO_NAME, digest: "sha256:aaa" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toContain(`/api/v1/registries/${REGISTRY_ID}/manifests/`)
    expect(url).toContain("sha256")
    expect(init.method).toBe("DELETE")
  })

  it("optimistically removes the tag from cache during mutation", async () => {
    let resolve: (v: unknown) => void
    globalThis.fetch = vi.fn(() => new Promise((r) => { resolve = r })) as typeof fetch

    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTag(), { wrapper })

    act(() => {
      result.current.mutate({ registryId: REGISTRY_ID, repoName: REPO_NAME, digest: "sha256:aaa" })
    })

    // onMutate runs synchronously before mutationFn resolves
    await waitFor(() => {
      const cached = queryClient.getQueryData<{ items: Tag[] }>(QUERY_KEY)
      expect(cached?.items.find((t) => t.digest === "sha256:aaa")).toBeUndefined()
      expect(cached?.items).toHaveLength(1)
    })

    // Resolve to avoid hanging
    resolve!({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null }) })
  })

  it("rolls back optimistic update on error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "server error" } }),
    }) as typeof fetch

    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTag(), { wrapper })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repoName: REPO_NAME, digest: "sha256:aaa" })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<{ items: Tag[] }>(QUERY_KEY)
    expect(cached?.items).toHaveLength(2)
  })

  it("calls invalidateQueries via onSettled after success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch

    const { invalidateSpy, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTag(), { wrapper })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repoName: REPO_NAME, digest: "sha256:aaa" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tags", REGISTRY_ID, REPO_NAME] }),
    )
  })

  it("calls invalidateQueries via onSettled even after error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "oops" } }),
    }) as typeof fetch

    const { invalidateSpy, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTag(), { wrapper })

    await act(async () => {
      result.current.mutate({ registryId: REGISTRY_ID, repoName: REPO_NAME, digest: "sha256:aaa" })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tags", REGISTRY_ID, REPO_NAME] }),
    )
  })
})

// ── useDeleteTags ─────────────────────────────────────────────────────────────

describe("useDeleteTags", () => {
  const QUERY_KEY = ["tags", REGISTRY_ID, REPO_NAME, 1, 50]
  const INITIAL_TAGS = [
    makeTag("v1", "sha256:aaa"),
    makeTag("v2", "sha256:bbb"),
    makeTag("v3", "sha256:aaa"), // same digest as v1 (shared)
  ]

  function setup() {
    const queryClient = makeQueryClient()
    queryClient.setQueryData(QUERY_KEY, { items: INITIAL_TAGS, meta: { page: 1, perPage: 50, total: 3, totalPages: 1 } })
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")
    const wrapper = makeWrapper(queryClient)
    return { queryClient, invalidateSpy, wrapper }
  }

  it("deduplicates digests before sending DELETE requests", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const { wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    // v1 and v3 share sha256:aaa — should only DELETE once
    await act(async () => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa", "sha256:bbb", "sha256:aaa"],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Only 2 unique digests → 2 DELETE calls
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it("optimistically removes all tags sharing deleted digests", async () => {
    let resolve: (v: unknown) => void
    globalThis.fetch = vi.fn(() => new Promise((r) => { resolve = r })) as typeof fetch

    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    act(() => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa"],
      })
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ items: Tag[] }>(QUERY_KEY)
      // v1 and v3 share sha256:aaa → both removed optimistically
      expect(cached?.items.every((t) => t.digest !== "sha256:aaa")).toBe(true)
      expect(cached?.items).toHaveLength(1)
    })

    resolve!({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null }) })
  })

  it("rolls back optimistic update on error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "server error" } }),
    }) as typeof fetch

    const { queryClient, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    await act(async () => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa"],
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const cached = queryClient.getQueryData<{ items: Tag[] }>(QUERY_KEY)
    expect(cached?.items).toHaveLength(3)
  })

  it("calls invalidateQueries via onSettled after success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch

    const { invalidateSpy, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    await act(async () => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa"],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tags", REGISTRY_ID, REPO_NAME] }),
    )
  })

  it("calls invalidateQueries via onSettled even after error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: "oops" } }),
    }) as typeof fetch

    const { invalidateSpy, wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    await act(async () => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa"],
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // onSettled fires whether success or error — guaranteed invalidation
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["tags", REGISTRY_ID, REPO_NAME] }),
    )
  })

  it("ignores digests that do not start with sha256:", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    })
    globalThis.fetch = fetchSpy as typeof fetch

    const { wrapper } = setup()
    const { result } = renderHook(() => useDeleteTags(), { wrapper })

    await act(async () => {
      result.current.mutate({
        registryId: REGISTRY_ID,
        repoName: REPO_NAME,
        digests: ["sha256:aaa", "invalid-digest", ""],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Only sha256:aaa passes the filter → 1 DELETE call
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
