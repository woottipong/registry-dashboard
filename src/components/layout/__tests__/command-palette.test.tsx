import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CommandPalette } from "@/components/layout/command-palette"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/hooks/use-registries", () => ({ useRegistries: () => ({ data: [
  { id: "hub", name: "Docker Hub", url: "https://example.com", capabilities: { canSearch: true } },
  { id: "hub2", name: "Second Hub", url: "https://example.org", capabilities: { canSearch: true } },
  { id: "private", name: "Private Registry", url: "https://example.net", capabilities: { canSearch: false } },
] }) }))
vi.mock("@/hooks/use-command-palette", () => ({ useCommandPalette: () => ({
  open: true, setOpen: vi.fn(), close: vi.fn(), query: "nginx", debouncedQuery: "nginx", setQuery: vi.fn(), history: [], submitSearch: vi.fn(), clearHistory: vi.fn(),
}) }))

afterEach(() => vi.unstubAllGlobals())

describe("CommandPalette", () => {
  it("searches a supported registry and identifies the search scope", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [{ name: "nginx", fullName: "library/nginx" }] }) })
    vi.stubGlobal("fetch", fetchMock)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><CommandPalette /></QueryClientProvider>)
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(await screen.findByText("library/nginx")).toBeInTheDocument()
    expect(screen.getByText("Repositories · Docker Hub")).toBeInTheDocument()
  })

  it("switches the repository search scope and avoids unsupported providers", async () => {
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
    const fetchMock = vi.fn().mockImplementation(async (url: string) => ({ ok: true, json: async () => ({ success: true, data: [{ name: "nginx", fullName: url.includes("hub2") ? "other/nginx" : "library/nginx" }] }) }))
    vi.stubGlobal("fetch", fetchMock)
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(<QueryClientProvider client={client}><CommandPalette /></QueryClientProvider>)
    expect(await screen.findByText("library/nginx")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Repository search"), { target: { value: "hub2" } })
    expect(await screen.findByText("other/nginx")).toBeInTheDocument()
    expect(screen.getByText("Repositories · Second Hub")).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Repository search"), { target: { value: "private" } })
    expect(screen.getByText(/does not support repository search/)).toBeInTheDocument()
    expect(screen.queryByText("other/nginx")).not.toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/private/"))).toBe(false)
  })
})
