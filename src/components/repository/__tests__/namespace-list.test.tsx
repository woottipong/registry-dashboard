import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NamespaceList, NamespaceSkeleton, RepoSkeleton } from "../namespace-list"
import type { Namespace, Repository } from "@/types/registry"

describe("NamespaceList", () => {
  const sampleNamespaces: Namespace[] = [
    { name: "team-a", repositoryCount: 3 },
    { name: "", repositoryCount: 1 }, // root
  ]

  const sampleRepos: Repository[] = [
    { name: "api", fullName: "team-a/api", namespace: "team-a" },
    { name: "web", fullName: "team-a/web", namespace: "team-a" },
    { name: "nginx", fullName: "nginx", namespace: "" },
  ]

  it("renders namespaces and root label correctly", () => {
    const onSelect = vi.fn()

    render(
      <NamespaceList
        namespaces={sampleNamespaces}
        allRepositories={sampleRepos}
        totalRepositories={4}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText("team-a/")).toBeInTheDocument()
    expect(screen.getByText("(root)")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // Test selection
    fireEvent.click(screen.getByText("team-a/"))
    expect(onSelect).toHaveBeenCalledWith("team-a")
  })

  it("renders NamespaceSkeleton without crashing", () => {
    const { container } = render(<NamespaceSkeleton />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  it("renders RepoSkeleton without crashing", () => {
    const { container } = render(<RepoSkeleton />)
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })
})

