import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { RegistryForm } from "@/components/registry/registry-form"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/hooks/use-registries", () => ({
  useAddRegistry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateRegistry: () => ({ mutateAsync: vi.fn(), isPending: false }),
  usePingRegistry: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("RegistryForm", () => {
  it("renders fieldset with accessible screen-reader legend", () => {
    render(<RegistryForm mode="create" />)
    const legend = screen.getByText("Registry configuration details")
    expect(legend).toBeInTheDocument()
    expect(legend).toHaveClass("sr-only")
  })

  it("renders accessible authentication radio group options with aria-describedby", () => {
    render(<RegistryForm mode="create" />)
    const noneRadio = screen.getByRole("radio", { name: "Anonymous" })
    const basicRadio = screen.getByRole("radio", { name: "Basic Auth" })
    const bearerRadio = screen.getByRole("radio", { name: "Bearer Token" })

    expect(noneRadio).toBeInTheDocument()
    expect(basicRadio).toBeInTheDocument()
    expect(bearerRadio).toBeInTheDocument()

    expect(noneRadio).toHaveAttribute("aria-describedby", "auth-none-note")
    expect(screen.getByText("Public pull access")).toHaveAttribute("id", "auth-none-note")
  })

  it("renders keyboard-accessible password toggle button when basic auth is selected", async () => {
    const user = userEvent.setup()
    render(<RegistryForm mode="create" />)

    const basicRadio = screen.getByRole("radio", { name: "Basic Auth" })
    await user.click(basicRadio)

    const passwordInput = screen.getByPlaceholderText("••••••••")
    expect(passwordInput).toHaveAttribute("type", "password")

    const toggleBtn = screen.getByRole("button", { name: "Show password" })
    expect(toggleBtn).toBeInTheDocument()
    // Must NOT have tabIndex -1 so keyboard users can focus it
    expect(toggleBtn).not.toHaveAttribute("tabindex", "-1")

    // Clicking toggle button switches to text
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument()

    // Clicking again switches back to password
    await user.click(screen.getByRole("button", { name: "Hide password" }))
    expect(passwordInput).toHaveAttribute("type", "password")
  })

  it("renders keyboard-accessible token toggle button when bearer auth is selected", async () => {
    const user = userEvent.setup()
    render(<RegistryForm mode="create" />)

    const bearerRadio = screen.getByRole("radio", { name: "Bearer Token" })
    await user.click(bearerRadio)

    const tokenInput = screen.getByPlaceholderText("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    expect(tokenInput).toHaveAttribute("type", "password")

    const toggleBtn = screen.getByRole("button", { name: "Show token" })
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).not.toHaveAttribute("tabindex", "-1")

    await user.click(toggleBtn)
    expect(tokenInput).toHaveAttribute("type", "text")
    expect(screen.getByRole("button", { name: "Hide token" })).toBeInTheDocument()
  })

  it("renders responsive action dock buttons with mobile-friendly touch targets", () => {
    render(<RegistryForm mode="create" />)
    const cancelLink = screen.getByRole("link", { name: "Cancel" })
    const submitBtn = screen.getByRole("button", { name: "Add Registry" })

    expect(cancelLink).toHaveClass("h-9")
    expect(cancelLink).toHaveClass("sm:h-8")
    expect(submitBtn).toHaveClass("h-9")
    expect(submitBtn).toHaveClass("sm:h-8")
  })

  it("validates required basic auth fields on submit", async () => {
    const user = userEvent.setup()
    render(<RegistryForm mode="create" />)

    const basicRadio = screen.getByRole("radio", { name: "Basic Auth" })
    await user.click(basicRadio)

    const submitBtn = screen.getByRole("button", { name: "Add Registry" })
    await user.click(submitBtn)

    expect(await screen.findByText("Name is required")).toBeInTheDocument()
    expect(await screen.findByText("Endpoint URL is required")).toBeInTheDocument()
    expect(await screen.findByText("Username is required for basic auth")).toBeInTheDocument()
    expect(await screen.findByText("Password or PAT is required for basic auth")).toBeInTheDocument()
  })

  it("validates required bearer token field on submit", async () => {
    const user = userEvent.setup()
    render(<RegistryForm mode="create" />)

    const bearerRadio = screen.getByRole("radio", { name: "Bearer Token" })
    await user.click(bearerRadio)

    const submitBtn = screen.getByRole("button", { name: "Add Registry" })
    await user.click(submitBtn)

    expect(await screen.findByText("Bearer token is required")).toBeInTheDocument()
  })
})
