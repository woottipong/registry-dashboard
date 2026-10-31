import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { Sidebar } from "@/components/layout/sidebar"

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock("@/hooks/use-registries", () => ({
  useRegistries: () => ({ data: [], isLoading: false }),
}))

afterEach(() => vi.unstubAllEnvs())

describe("Sidebar version", () => {
  it.each(["v2.3.4-test", "v5.6.7-test"])("displays configured version %s", (version) => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", version)
    render(<Sidebar />)
    expect(screen.getByText(version)).toBeInTheDocument()
  })
})
