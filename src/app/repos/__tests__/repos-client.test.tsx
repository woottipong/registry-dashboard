import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RepositoriesClient } from "@/app/repos/repos-client"
import type { RegistryConnection } from "@/types/registry"

const state = vi.hoisted(() => ({ loading: true, error: false }))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/repos",
  useSearchParams: () => new URLSearchParams("registry=reg&namespace=team"),
}))
vi.mock("@/hooks/use-registries", () => ({ useRegistries: ({ initialData }: { initialData: RegistryConnection[] }) => ({ data: initialData }) }))
vi.mock("@/hooks/use-namespaces", () => ({ useNamespaces: () => ({ data: [] }) }))
vi.mock("@/hooks/use-repositories", () => ({ useRepositories: () => ({ isLoading: state.loading, isError: state.error, data: undefined, refetch: vi.fn() }) }))

const registry: RegistryConnection = { id: "reg", name: "Registry", url: "https://example.com", provider: "generic", authType: "none", createdAt: "2024-01-01" }

describe("Repository inventory count", () => {
  it("does not report zero while the repository list is loading or has failed", () => {
    state.loading = true
    state.error = false
    const { rerender } = render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    expect(screen.getByText("Loading repositories…")).toBeInTheDocument()
    expect(screen.queryByText(/0 repositories in/)).not.toBeInTheDocument()
    state.loading = false
    state.error = true
    rerender(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    expect(screen.getByText("Repository count unavailable")).toBeInTheDocument()
  })
})
