import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { DashboardRecentPushes, type RecentPushedItem } from "../dashboard-recent-pushes"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("DashboardRecentPushes", () => {
  const sampleItems: RecentPushedItem[] = [
    {
      id: "push-1",
      repository: "apps/web",
      tag: "v1.0.0",
      registryName: "Local Registry",
      user: "dev",
      timestamp: "2026-10-29T10:00:00Z",
      pullCommand: "docker pull registry.local/apps/web:v1.0.0",
      href: "/repos/reg-1/apps/web?tag=v1.0.0",
    },
  ]

  it("renders recent pushed items correctly", () => {
    const onCopyCommand = vi.fn()

    render(
      <DashboardRecentPushes
        recentPushedImages={sampleItems}
        isMounted={true}
        copiedCommandId={null}
        onCopyCommand={onCopyCommand}
      />
    )

    expect(screen.getByText("Recent pushed images")).toBeInTheDocument()
    expect(screen.getByText("apps/web")).toBeInTheDocument()
    expect(screen.getByText("v1.0.0")).toBeInTheDocument()

    const copyBtn = screen.getByLabelText("Copy pull command for apps/web")
    fireEvent.click(copyBtn)
    expect(onCopyCommand).toHaveBeenCalledWith(
      "docker pull registry.local/apps/web:v1.0.0",
      "push-1",
    )
  })

  it("shows empty state when no items exist", () => {
    render(
      <DashboardRecentPushes
        recentPushedImages={[]}
        isMounted={true}
        copiedCommandId={null}
        onCopyCommand={vi.fn()}
      />
    )

    expect(screen.getByText("No pushed images recorded yet.")).toBeInTheDocument()
  })
})

