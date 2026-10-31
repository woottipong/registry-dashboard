import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardRegistryDistribution } from "../dashboard-registry-distribution"

describe("DashboardRegistryDistribution", () => {
  it("renders registry percentage bars correctly", () => {
    const stats = [
      { id: "reg-1", name: "Production Registry", repoCount: 8 },
      { id: "reg-2", name: "Staging Registry", repoCount: 2 },
    ]

    render(
      <DashboardRegistryDistribution
        registriesWithStats={stats}
        totalRepositories={10}
        isLoadingRegistries={false}
      />
    )

    expect(screen.getByText("Registry distribution")).toBeInTheDocument()
    expect(screen.getByText("Production Registry")).toBeInTheDocument()
    expect(screen.getByText("8 of 10 · 80%")).toBeInTheDocument()
    expect(screen.getByText("Staging Registry")).toBeInTheDocument()
    expect(screen.getByText("2 of 10 · 20%")).toBeInTheDocument()

    const progressbars = screen.getAllByRole("progressbar")
    expect(progressbars.length).toBe(2)
    expect(progressbars[0]).toHaveAttribute("aria-valuenow", "80")
  })

  it("displays warning when endpoint failures are detected", () => {
    render(
      <DashboardRegistryDistribution
        registriesWithStats={[{ id: "reg-1", name: "Prod", repoCount: 5 }]}
        totalRepositories={5}
        isLoadingRegistries={false}
        failedRegistryNames={["Internal Registry"]}
      />
    )

    expect(
      screen.getByText("Warning: 1 endpoint unreachable (Internal Registry).")
    ).toBeInTheDocument()
  })

  it("renders empty state when no registries connected", () => {
    render(
      <DashboardRegistryDistribution
        registriesWithStats={[]}
        totalRepositories={0}
        isLoadingRegistries={false}
      />
    )

    expect(screen.getByText("No registries connected yet.")).toBeInTheDocument()
  })
})

