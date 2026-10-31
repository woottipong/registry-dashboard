import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RepoTable } from "@/components/repository/repo-table"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe("RepoTable", () => {
  it("exposes repository navigation as a link and distinguishes unknown tags", () => {
    const client = new QueryClient()
    render(<QueryClientProvider client={client}><RepoTable registryId="reg-1" repositories={[
      { name: "web", fullName: "team/web" },
      { name: "empty", fullName: "team/empty", tagCount: 0 },
    ]} /></QueryClientProvider>)
    expect(screen.getByRole("link", { name: "web" })).toHaveAttribute("href", "/repos/reg-1/team/web")
    expect(screen.getByText("Tags unavailable")).toBeInTheDocument()
    expect(screen.getByText("0 tags")).toBeInTheDocument()
  })
})
