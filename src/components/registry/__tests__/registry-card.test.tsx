import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { RegistryCard } from "@/components/registry/registry-card"
import type { RegistryConnection } from "@/types/registry"

vi.mock("@/hooks/use-registries", () => ({
  usePingRegistry: () => ({ isPending: false, isError: false, data: { status: "error", latencyMs: 123 }, mutate: vi.fn() }),
}))

const registry: RegistryConnection = { id: "reg-1", name: "Registry", url: "https://example.com", provider: "generic", authType: "none", createdAt: "2024-01-01" }

describe("RegistryCard", () => {
  it("shows a failed ping as needing attention", () => {
    render(<RegistryCard registry={registry} onDelete={vi.fn()} onSetDefault={vi.fn()} />)
    expect(screen.getByText("Needs attention")).toBeInTheDocument()
    expect(screen.queryByText("Not tested")).not.toBeInTheDocument()
  })
})
