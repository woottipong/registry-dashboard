import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TagExplorerClient } from "@/app/repos/[registry]/[...name]/tag-explorer-client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/hooks/use-registries", () => ({
  useRegistry: () => ({ data: { name: "Registry", url: "https://example.com", capabilities: { canDelete: true } } }),
}))
vi.mock("@/contexts/activity-context", () => ({ useActivity: () => ({ addActivity: vi.fn() }) }))

const tag = (name: string) => ({ name, digest: "sha256:shared", size: 1, createdAt: null, architecture: "amd64", os: "linux" })

function renderExplorer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={client}><TagExplorerClient registryId="reg" repoName="team/app" /></QueryClientProvider>)
}

afterEach(() => vi.unstubAllGlobals())

describe("tag deletion confirmation", () => {
  it("warns about an unfiltered tag on another page after searching", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const params = new URL(input, "http://localhost").searchParams
      const search = params.get("search")
      const checking = params.get("perPage") === "100"
      const page = Number(params.get("page"))
      const items = search ? [tag("latest")] : checking && page === 2 ? [tag("stable")] : checking ? [tag("latest")] : [tag("latest"), tag("stable")]
      return { ok: true, json: async () => ({ success: true, data: items, meta: { page, perPage: checking ? 1 : 50, total: search ? 1 : 2, totalPages: checking ? 2 : 1 } }) }
    }))

    renderExplorer()
    fireEvent.change(screen.getByPlaceholderText("Filter tags…"), { target: { value: "latest" } })
    await screen.findByRole("link", { name: "latest" })
    await waitFor(() => expect(screen.queryByRole("link", { name: "stable" })).not.toBeInTheDocument())
    fireEvent.click(await screen.findByRole("button", { name: "Delete tag" }))

    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByText("stable")).toBeInTheDocument()
    expect(within(dialog).getByText(/Shared digest warning/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByPlaceholderText("latest"), { target: { value: "latest" } })
    expect(within(dialog).getByRole("button", { name: "Delete tag" })).toBeEnabled()
  })

  it("blocks confirmation when the full tag inventory fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const params = new URL(input, "http://localhost").searchParams
      if (params.get("perPage") === "100") return { ok: false, json: async () => ({ success: false }) }
      return { ok: true, json: async () => ({ success: true, data: [tag("latest")], meta: { page: 1, perPage: 50, total: 1, totalPages: 1 } }) }
    }))

    renderExplorer()
    await screen.findByRole("link", { name: "latest" })
    fireEvent.click(await screen.findByRole("button", { name: "Delete tag" }))
    const dialog = await screen.findByRole("dialog")
    expect(await within(dialog).findByText(/Could not verify all tags/)).toBeInTheDocument()
    fireEvent.change(within(dialog).getByPlaceholderText("latest"), { target: { value: "latest" } })
    expect(within(dialog).getByRole("button", { name: "Delete tag" })).toBeDisabled()
  })
})
