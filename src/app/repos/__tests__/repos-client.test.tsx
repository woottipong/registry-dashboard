import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { RepositoriesClient } from "@/app/repos/repos-client"
import type { RegistryConnection } from "@/types/registry"
import type { Repository } from "@/types/registry"

const state = vi.hoisted(() => ({
  loading: true, error: false, namespace: true, namespaceError: false,
  searchError: false, searchLoading: false, searchPages: 1,
  emptySearchPage: false,
  namespaces: [] as { name: string; repositoryCount: number }[],
  retrySearch: vi.fn(), retryNamespaces: vi.fn(),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/repos",
  useSearchParams: () => new URLSearchParams(state.namespace ? "registry=reg&namespace=team" : "registry=reg"),
}))
vi.mock("@/hooks/use-debounce", () => ({ useDebounce: (value: string) => value }))
vi.mock("@/components/repository/repo-table", () => ({
  RepoTable: ({ repositories }: { repositories: Repository[] }) => <div>{repositories.map((repo) => <span key={repo.fullName}>{repo.name}</span>)}</div>,
}))
vi.mock("@/hooks/use-registries", () => ({ useRegistries: ({ initialData }: { initialData: RegistryConnection[] }) => ({ data: initialData }) }))
vi.mock("@/hooks/use-namespaces", () => ({ useNamespaces: () => ({ data: state.namespaces, isLoading: false, isError: state.namespaceError, refetch: state.retryNamespaces }) }))
vi.mock("@/hooks/use-repositories", () => ({
  useRepositories: () => ({ isLoading: state.loading, isError: state.error, data: undefined, refetch: vi.fn() }),
  useSearchRepositories: (_registry: string, query: string, page: number) => ({
    isLoading: state.searchLoading,
    isError: state.searchError,
    refetch: state.retrySearch,
    data: query && state.searchPages > 1 ? {
      items: state.emptySearchPage ? [] : [{ name: `web-${page}`, fullName: `team/web-${page}`, namespace: "team", tagCount: 1 }],
      meta: { page, perPage: 1, total: state.searchPages, totalPages: state.searchPages },
    } : undefined,
  }),
}))

const registry: RegistryConnection = { id: "reg", name: "Registry", url: "https://example.com", provider: "generic", authType: "none", createdAt: "2024-01-01" }

beforeEach(() => {
  state.loading = true
  state.error = false
  state.namespace = true
  state.namespaceError = false
  state.searchError = false
  state.searchLoading = false
  state.searchPages = 1
  state.emptySearchPage = false
  state.namespaces = []
  vi.clearAllMocks()
})

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

describe("Repository search", () => {
  it("reports a failed search and allows retry instead of claiming no matches", () => {
    state.namespace = false
    state.searchError = true
    render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    fireEvent.change(screen.getByLabelText("Search repositories or namespaces"), { target: { value: "web" } })
    expect(screen.getByText("Failed to load")).toBeInTheDocument()
    expect(screen.queryByText("No namespaces or repositories match your search.")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(state.retrySearch).toHaveBeenCalledOnce()
  })

  it("reports a namespace failure independently of search results", () => {
    state.namespace = false
    state.namespaceError = true
    render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    fireEvent.change(screen.getByLabelText("Search repositories or namespaces"), { target: { value: "web" } })
    expect(screen.getByText("Failed to load")).toBeInTheDocument()
    expect(screen.queryByText("No namespaces or repositories match your search.")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(state.retryNamespaces).toHaveBeenCalledOnce()
  })

  it("navigates search pages and returns to page one for a new query", () => {
    state.namespace = false
    state.searchPages = 2
    render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    const input = screen.getByLabelText("Search repositories or namespaces")
    fireEvent.change(input, { target: { value: "web" } })
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument()
    expect(screen.getByText("web-2")).toBeInTheDocument()
    fireEvent.change(input, { target: { value: "api" } })
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()
  })

  it("does not claim all results are empty when a search page has no matches", () => {
    state.namespace = false
    state.searchPages = 2
    state.emptySearchPage = true
    render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    fireEvent.change(screen.getByLabelText("Search repositories or namespaces"), { target: { value: "web" } })
    expect(screen.getByText("No matches on this page. Try another page.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled()
  })

  it("matches namespaces when the search has surrounding whitespace", () => {
    state.namespace = false
    state.namespaces = [{ name: "backend", repositoryCount: 1 }]
    render(<RepositoriesClient initialRegistry="reg" initialRegistries={[registry]} />)
    fireEvent.change(screen.getByLabelText("Search repositories or namespaces"), { target: { value: " backend " } })
    expect(screen.getByText("Matching Namespaces")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /backend/ })).toBeInTheDocument()
  })
})
