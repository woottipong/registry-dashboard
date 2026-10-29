import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TagActions } from "@/components/tag/tag-actions"

const notifications = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast: notifications }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe("TagActions clipboard feedback", () => {
  const props = {
    registryId: "reg",
    repoName: "team/app",
    tag: { name: "latest", digest: "sha256:123", size: 1, createdAt: "", os: "linux", architecture: "amd64" },
    canDelete: true,
    onDeleteClick: vi.fn(),
  }

  it("reports success only after the clipboard write succeeds", async () => {
    let resolveWrite!: () => void
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockReturnValue(new Promise<void>((resolve) => { resolveWrite = resolve })) } })
    render(<TagActions {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Copy pull command" }))
    expect(notifications.success).not.toHaveBeenCalled()
    resolveWrite()
    await waitFor(() => expect(notifications.success).toHaveBeenCalledOnce())
  })

  it("reports clipboard failure without claiming success", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } })
    render(<TagActions {...props} />)
    fireEvent.click(screen.getByRole("button", { name: "Copy pull command" }))
    await waitFor(() => expect(notifications.error).toHaveBeenCalledOnce())
    expect(notifications.success).not.toHaveBeenCalled()
  })
})
