import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardKpis } from "../dashboard-kpis"

describe("DashboardKpis", () => {
  it("renders metric numbers correctly when loaded", () => {
    render(
      <DashboardKpis
        registryCount={3}
        totalRepositories={12}
        totalTags={45}
        providerCount={2}
        isLoadingRegistries={false}
        isLoadingRepos={false}
      />
    )

    expect(screen.getByText("Registries")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("Repositories")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("Image Tags")).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
    expect(screen.getByText("Providers")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("renders skeletons when loading", () => {
    const { container } = render(
      <DashboardKpis
        registryCount={0}
        totalRepositories={0}
        totalTags={0}
        providerCount={0}
        isLoadingRegistries={true}
        isLoadingRepos={true}
      />
    )

    expect(screen.queryByText("12")).not.toBeInTheDocument()
    // Verify skeletons are rendered
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThanOrEqual(4)
  })

  it("distinguishes unknown tag counts from confirmed zero", () => {
    render(
      <DashboardKpis
        registryCount={1}
        totalRepositories={5}
        totalTags={0}
        providerCount={1}
        isLoadingRegistries={false}
        isLoadingRepos={false}
        hasUnknownTagCounts={true}
      />
    )

    expect(screen.getByText("—")).toBeInTheDocument()
  })
})

