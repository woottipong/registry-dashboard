import React from "react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useNamespaces } from "@/hooks/use-namespaces"
import type { Namespace } from "@/types/registry"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  })
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const REGISTRY_ID = "reg-1"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

describe("useNamespaces", () => {
  it("fetches namespaces and returns them", async () => {
    const namespaces: Namespace[] = [
      { name: "library", repositoryCount: 10 },
      { name: "myorg", repositoryCount: 5 },
    ]

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: namespaces }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(REGISTRY_ID), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(namespaces)
  })

  it("calls the correct API endpoint", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(() => useNamespaces(REGISTRY_ID), { wrapper: makeWrapper(queryClient) })

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    const calledUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(calledUrl).toBe(`/api/v1/registries/${REGISTRY_ID}/namespaces`)
  })

  it("is disabled when registryId is empty", async () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(""), {
      wrapper: makeWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("throws on API error response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Registry not found" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(REGISTRY_ID), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Error message from API response is propagated directly
    expect((result.current.error as Error).message).toContain("Registry not found")
  })

  it("throws generic message when no error detail provided", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, data: null }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(REGISTRY_ID), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toContain("Request failed")
  })

  it("throws when response is ok but success is false", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Something went wrong" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(REGISTRY_ID), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toContain("Something went wrong")
  })

  it("throws when data is not an array", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(() => useNamespaces(REGISTRY_ID), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
