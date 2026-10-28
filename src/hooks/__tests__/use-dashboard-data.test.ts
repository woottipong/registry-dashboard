import React from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import type { RegistryConnection } from "@/types/registry"

const registry: RegistryConnection = {
  id: "reg-1", name: "Example", url: "https://registry.example.com",
  provider: "generic", authType: "none", createdAt: "2025-01-01",
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children)
  return renderHook(() => useDashboardData({ initialRegistries: [registry] }), { wrapper })
}

afterEach(() => vi.unstubAllGlobals())

describe("useDashboardData", () => {
  it("reports a failed registry and retries it without treating failure as complete data", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ success: false, error: { message: "Unavailable" } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: [{ name: "web", fullName: "web", tagCount: 2 }] }) })
    vi.stubGlobal("fetch", fetchMock)
    const { result } = setup()

    await waitFor(() => expect(result.current.failedRegistryIds).toEqual(["reg-1"]))
    expect(result.current.hasIncompleteData).toBe(true)
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.failedRegistryIds).toEqual([]))
    expect(result.current.dashboardData.totalRepositories).toBe(1)
    expect(result.current.dashboardData.totalTags).toBe(2)
  })

  it("identifies missing tag counts and paginated repository data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [{ name: "web", fullName: "web" }], meta: { page: 1, perPage: 1, total: 2, totalPages: 2 } }),
    }))
    const { result } = setup()

    await waitFor(() => expect(result.current.isLoadingRepos).toBe(false))
    expect(result.current.hasUnknownTagCounts).toBe(true)
    expect(result.current.hasIncompleteData).toBe(true)
    expect(result.current.dashboardData.registriesWithStats[0].tagCount).toBeNull()
  })
})
