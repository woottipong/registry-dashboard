import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DashboardRepoInventory } from "../dashboard-repo-inventory"
import type { DashboardRepoItem } from "@/hooks/use-dashboard-data"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

describe("DashboardRepoInventory", () => {
  const sampleRepos: DashboardRepoItem[] = [
    {
      name: "web",
      fullName: "apps/web",
      namespace: "apps",
      registryId: "reg-1",
      registryName: "Local Registry",
      provider: "generic",
      tagCount: 5,
    },
  ]

  it("renders repository rows with tags and volume", () => {
    const onTabChange = vi.fn()
    const onSearchChange = vi.fn()

    render(
      <DashboardRepoInventory
        repositories={sampleRepos}
        topRepositories={sampleRepos}
        registriesWithStats={[{ id: "reg-1", name: "Local", repoCount: 1 }]}
        activeTab="all"
        onTabChange={onTabChange}
        tableSearch=""
        onSearchChange={onSearchChange}
        isLoadingRegistries={false}
        isLoadingRepos={false}
        totalTags={10}
      />
    )

    expect(screen.getByText("web")).toBeInTheDocument()
    expect(screen.getAllByText("apps").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("5 tags")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("View all 1 repos")).toBeInTheDocument()

    // Test filter input
    const input = screen.getByPlaceholderText("Filter repos…")
    fireEvent.change(input, { target: { value: "web" } })
    expect(onSearchChange).toHaveBeenCalledWith("web")

    // Test tab change
    const localTab = screen.getByText("Local")
    fireEvent.click(localTab)
    expect(onTabChange).toHaveBeenCalledWith("reg-1")
  })

  it("handles column sorting and inline pull command copy", () => {
    const onSortChange = vi.fn()
    const onCopyCommand = vi.fn()

    render(
      <DashboardRepoInventory
        repositories={sampleRepos}
        topRepositories={sampleRepos}
        registriesWithStats={[{ id: "reg-1", name: "Local", repoCount: 1 }]}
        activeTab="all"
        onTabChange={vi.fn()}
        tableSearch=""
        onSearchChange={vi.fn()}
        isLoadingRegistries={false}
        isLoadingRepos={false}
        totalTags={10}
        sortBy="tags"
        sortOrder="desc"
        onSortChange={onSortChange}
        copiedCommandId={null}
        onCopyCommand={onCopyCommand}
      />
    )

    // Sort buttons
    const repoSortBtn = screen.getByText("Repository")
    fireEvent.click(repoSortBtn)
    expect(onSortChange).toHaveBeenCalledWith("name")

    const tagsSortBtn = screen.getByText("Tags & Volume")
    fireEvent.click(tagsSortBtn)
    expect(onSortChange).toHaveBeenCalledWith("tags")

    // Copy pull command button
    const copyBtn = screen.getByLabelText("Copy pull command for apps/web")
    fireEvent.click(copyBtn)
    expect(onCopyCommand).toHaveBeenCalledWith("docker pull apps/web:latest", "reg-1-apps/web")
  })

  it("shows empty state when no repositories match filter", () => {
    render(
      <DashboardRepoInventory
        repositories={sampleRepos}
        topRepositories={[]}
        registriesWithStats={[]}
        activeTab="all"
        onTabChange={vi.fn()}
        tableSearch="nonexistent"
        onSearchChange={vi.fn()}
        isLoadingRegistries={false}
        isLoadingRepos={false}
        totalTags={10}
      />
    )

    expect(screen.getByText("No repositories found matching this filter.")).toBeInTheDocument()
  })
})
