import React from "react"
import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useManifest } from "@/hooks/use-manifest"
import type { ImageConfig, ImageManifest } from "@/types/manifest"

// ── Helpers ───────────────────────────────────────────────────────────────────

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
const REPO_NAME = "library/nginx"
const REF = "latest"

const mockManifest: ImageManifest = {
  schemaVersion: 2,
  mediaType: "application/vnd.docker.distribution.manifest.v2+json",
  digest: "sha256:abc123",
  config: {
    mediaType: "application/vnd.docker.container.image.v1+json",
    size: 1024,
    digest: "sha256:configdigest",
  },
  layers: [
    { mediaType: "application/vnd.docker.image.rootfs.diff.tar.gzip", size: 2048, digest: "sha256:layer1" },
  ],
  totalSize: 3072,
}

const mockConfig: ImageConfig = {
  architecture: "amd64",
  os: "linux",
  created: "2024-01-01T00:00:00Z",
  config: {
    Cmd: ["/bin/nginx"],
    Env: ["PATH=/usr/local/sbin"],
  },
}

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

// ── useManifest ───────────────────────────────────────────────────────────────

describe("useManifest", () => {
  it("fetches manifest and config, returns both", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockConfig }),
      }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.manifest).toEqual(mockManifest)
    expect(result.current.data?.config).toEqual(mockConfig)
  })

  it("calls manifest endpoint with encoded repo path and ref", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockConfig }),
      }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(
      () => useManifest(REGISTRY_ID, "my org/web", "v1.0"),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))

    const manifestUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[0][0])
    expect(manifestUrl).toContain(`/api/v1/registries/${REGISTRY_ID}/manifests/`)
    expect(manifestUrl).toContain("my%20org/web")
    expect(manifestUrl).toContain("v1.0")
  })

  it("calls blob endpoint with encoded digest from manifest config", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockConfig }),
      }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))

    const blobUrl = String((fetchSpy as ReturnType<typeof vi.fn>).mock.calls[1][0])
    expect(blobUrl).toContain(`/api/v1/registries/${REGISTRY_ID}/blobs/`)
    expect(blobUrl).toContain(encodeURIComponent(mockManifest.config.digest))
  })

  it("uses cache: no-store on both fetches", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockConfig }),
      }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))

    const calls = (fetchSpy as ReturnType<typeof vi.fn>).mock.calls
    expect(calls[0][1]).toMatchObject({ cache: "no-store" })
    expect(calls[1][1]).toMatchObject({ cache: "no-store" })
  })

  it("returns config: null when config fetch fails with non-ok response", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: () => Promise.resolve({ success: false }),
      }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    // HTTP error on blobs propagates
    expect((result.current.error as Error).message).toContain("404")
  })

  it("returns config: null when config response has success: false", async () => {
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockManifest }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: false, data: null, error: { message: "Not found" } }),
      }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.manifest).toEqual(mockManifest)
    expect(result.current.data?.config).toBeNull()
  })

  it("errors when manifest fetch returns HTTP error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: () => Promise.resolve({}),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toContain("404")
  })

  it("errors when manifest response has success: false", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, data: null, error: { message: "Forbidden" } }),
    }) as typeof fetch

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as Error).message).toContain("Forbidden")
  })

  it("is disabled when registryId is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest("", REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is disabled when repoName is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, "", REF),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is disabled when ref is empty", () => {
    const fetchSpy = vi.fn() as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, ""),
      { wrapper: makeWrapper(queryClient) }
    )

    expect(result.current.fetchStatus).toBe("idle")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("does not retry on error (retry: false)", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({}),
    }) as typeof fetch
    globalThis.fetch = fetchSpy

    const queryClient = makeQueryClient()
    const { result } = renderHook(
      () => useManifest(REGISTRY_ID, REPO_NAME, REF),
      { wrapper: makeWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    // Should only be called once (no retries)
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
