import React from "react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, waitFor, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  useRegistries,
  useRegistry,
  usePingRegistry,
  useAddRegistry,
  useUpdateRegistry,
  useSetDefaultRegistry,
  useDeleteRegistry,
} from "@/hooks/use-registries"
import type { RegistryConnection } from "@/types/registry"

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

const makeRegistry = (id = "reg-1"): RegistryConnection => ({
  id,
  name: "Test Registry",
  url: "https://registry.test.com",
  provider: "generic",
  authType: "none",
  createdAt: "2024-01-01T00:00:00Z",
})

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

// ── useRegistries ─────────────────────────────────────────────────────────────

describe("useRegistries", () => {
  it("fetches all registries", async () => {
    const registries = [makeRegistry("r1"), makeRegistry("r2")]
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: registries }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useRegistries(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(registries)
  })

  it("calls /api/v1/registries", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(() => useRegistries(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])).toBe("/api/v1/registries")
  })

  it("throws when API returns error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Unauthorized" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useRegistries(), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe("Unauthorized")
  })

  it("accepts initialData option", async () => {
    const initialData = [makeRegistry()]
    // Fetch should not be called immediately with initialData (staleTime handles this)
    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useRegistries({ initialData }),
      { wrapper: makeWrapper(queryClient) }
    )

    // initialData is used immediately
    expect(result.current.data).toEqual(initialData)
  })
})

// ── useRegistry ───────────────────────────────────────────────────────────────

describe("useRegistry", () => {
  it("fetches a single registry by id", async () => {
    const registry = makeRegistry("r1")
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: registry }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useRegistry("r1"), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(registry)
  })

  it("calls the correct endpoint", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: makeRegistry() }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(() => useRegistry("my-reg"), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])).toBe("/api/v1/registries/my-reg")
  })

  it("is disabled when id is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useRegistry(""), { wrapper: makeWrapper(queryClient) })

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

// ── usePingRegistry ───────────────────────────────────────────────────────────

describe("usePingRegistry", () => {
  it("returns ping result on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { status: "ok", latencyMs: 42 } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => usePingRegistry("reg-1"), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => { result.current.mutate() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ status: "ok", latencyMs: 42 })
  })

  it("throws on ping failure", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Unreachable" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => usePingRegistry("reg-1"), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => { result.current.mutate() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe("Unreachable")
  })
})

// ── useAddRegistry ────────────────────────────────────────────────────────────

describe("useAddRegistry", () => {
  it("POSTs to /api/v1/registries and returns new registry", async () => {
    const newRegistry = makeRegistry("new-id")
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: newRegistry }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useAddRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        name: "Test",
        url: "https://registry.test.com",
        provider: "generic",
        authType: "none",
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [url, options] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toBe("/api/v1/registries")
    expect(options.method).toBe("POST")
    expect(result.current.data).toEqual(newRegistry)
  })

  it("invalidates registries query on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: makeRegistry() }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useAddRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ name: "T", url: "https://r.test", provider: "generic", authType: "none" })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["registries"] })
    )
  })
})

// ── useUpdateRegistry ─────────────────────────────────────────────────────────

describe("useUpdateRegistry", () => {
  it("PUTs to the correct endpoint", async () => {
    const updated = makeRegistry("r1")
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: updated }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useUpdateRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        id: "r1",
        payload: { name: "Updated", url: "https://r.test", provider: "generic", authType: "none" },
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [url, options] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toBe("/api/v1/registries/r1")
    expect(options.method).toBe("PUT")
  })

  it("invalidates both all registries and byId queries on success", async () => {
    const updated = makeRegistry("r1")
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: updated }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useUpdateRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({
        id: "r1",
        payload: { name: "U", url: "https://r.test", provider: "generic", authType: "none" },
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const keys = invalidateSpy.mock.calls.map((c) => JSON.stringify((c[0] as { queryKey: unknown }).queryKey))
    expect(keys.some((k) => k.includes('"registries"'))).toBe(true)
    expect(keys.some((k) => k.includes('"r1"'))).toBe(true)
  })
})

// ── useSetDefaultRegistry ─────────────────────────────────────────────────────

describe("useSetDefaultRegistry", () => {
  it("sends PUT with isDefault: true", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...makeRegistry(), isDefault: true } }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useSetDefaultRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ id: "r1", registry: makeRegistry() })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [, options] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = JSON.parse(options.body as string)
    expect(body.isDefault).toBe(true)
  })

  it("invalidates all registries on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { ...makeRegistry(), isDefault: true } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useSetDefaultRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      result.current.mutate({ id: "r1", registry: makeRegistry() })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["registries"] })
    )
  })
})

// ── useDeleteRegistry ─────────────────────────────────────────────────────────

describe("useDeleteRegistry", () => {
  it("sends DELETE to the correct URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => { result.current.mutate("reg-1") })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [url, options] = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(String(url)).toBe("/api/v1/registries/reg-1")
    expect(options.method).toBe("DELETE")
  })

  it("throws when API returns error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: { message: "Not found" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => { result.current.mutate("reg-1") })
    await waitFor(() => expect(result.current.isError).toBe(true))
    // API error message is propagated; fallback is "Delete failed"
    expect((result.current.error as Error).message).toBe("Not found")
  })

  it("throws fallback message when no error detail provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useDeleteRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => { result.current.mutate("reg-1") })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toBe("Delete failed")
  })

  it("invalidates all registries on success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    const { result } = renderHook(() => useDeleteRegistry(), { wrapper: makeWrapper(queryClient) })

    await act(async () => { result.current.mutate("reg-1") })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["registries"] })
    )
  })
})
