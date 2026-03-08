import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BulkDeleteDialog, DeleteDialog } from "@/components/tag/delete-dialog"
import type { Tag } from "@/types/registry"

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeTag = (name: string, digest?: string): Tag => ({
  name,
  digest: digest ?? `sha256:${name}000`,
  size: 1024,
  createdAt: "2024-01-01T00:00:00Z",
  os: "linux",
  architecture: "amd64",
})

// ── BulkDeleteDialog ──────────────────────────────────────────────────────────

describe("BulkDeleteDialog", () => {
  const defaultProps = {
    tags: [makeTag("v1", "sha256:abc123"), makeTag("v2", "sha256:def456")],
    sideEffectTags: [] as string[],
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the count of tags in the dialog title", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    expect(screen.getByRole("heading", { name: /delete 2 tags/i })).toBeInTheDocument()
  })

  it("renders singular 'tag' when count is 1", () => {
    render(<BulkDeleteDialog {...defaultProps} tags={[makeTag("v1")]} />)
    expect(screen.getByRole("heading", { name: /delete 1 tag/i })).toBeInTheDocument()
  })

  it("lists all tag names in the tags-to-delete panel", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    expect(screen.getByText("v1")).toBeInTheDocument()
    expect(screen.getByText("v2")).toBeInTheDocument()
  })

  it("shows truncated digest alongside each tag name", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    // truncateDigest("sha256:abc123", 8) → "sha256:abc123..." (short enough to show fully or truncated)
    // Just assert the digest prefix is visible
    const digests = screen.getAllByText(/sha256:/i)
    expect(digests.length).toBeGreaterThanOrEqual(1)
  })

  it("does NOT render the side-effect warning when sideEffectTags is empty", () => {
    render(<BulkDeleteDialog {...defaultProps} sideEffectTags={[]} />)
    expect(screen.queryByText(/also deletes unselected tags/i)).not.toBeInTheDocument()
  })

  it("renders the side-effect warning when sideEffectTags is non-empty", () => {
    render(<BulkDeleteDialog {...defaultProps} sideEffectTags={["v3", "v4"]} />)
    expect(screen.getByText(/also deletes unselected tags/i)).toBeInTheDocument()
    expect(screen.getByText("v3")).toBeInTheDocument()
    expect(screen.getByText("v4")).toBeInTheDocument()
  })

  it("calls onConfirm when delete button is clicked", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    const deleteButton = screen.getByRole("button", { name: /delete 2 tags/i })
    fireEvent.click(deleteButton)
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it("shows 'Deleting…' and disables the button when isPending is true", () => {
    render(<BulkDeleteDialog {...defaultProps} isPending />)
    const button = screen.getByRole("button", { name: /deleting/i })
    expect(button).toBeDisabled()
  })

  it("delete button is enabled when not pending", () => {
    render(<BulkDeleteDialog {...defaultProps} isPending={false} />)
    const button = screen.getByRole("button", { name: /delete 2 tags/i })
    expect(button).not.toBeDisabled()
  })

  it("shows 'cannot be undone' warning in description", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument()
  })

  it("renders the 'Tags to delete' section label", () => {
    render(<BulkDeleteDialog {...defaultProps} />)
    expect(screen.getByText(/tags to delete/i)).toBeInTheDocument()
  })
})

// ── DeleteDialog ──────────────────────────────────────────────────────────────

describe("DeleteDialog", () => {
  const tag = makeTag("v1.0.0", "sha256:abc123def456")

  const defaultProps = {
    tag,
    sharedWith: [] as string[],
    open: true,
    onOpenChange: vi.fn(),
    onConfirm: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the tag name in the confirmation panel", () => {
    render(<DeleteDialog {...defaultProps} />)
    // Tag name appears in the info box AND in the confirmation label
    const names = screen.getAllByText("v1.0.0")
    expect(names.length).toBeGreaterThanOrEqual(1)
  })

  it("shows truncated digest in the info box", () => {
    render(<DeleteDialog {...defaultProps} />)
    expect(screen.getByText(/sha256:/i)).toBeInTheDocument()
  })

  it("delete button is disabled when confirmation text is empty", () => {
    render(<DeleteDialog {...defaultProps} />)
    const button = screen.getByRole("button", { name: /delete tag/i })
    expect(button).toBeDisabled()
  })

  it("delete button is disabled when confirmation text does not match tag name", () => {
    render(<DeleteDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "wrong-name" } })
    const button = screen.getByRole("button", { name: /delete tag/i })
    expect(button).toBeDisabled()
  })

  it("delete button is enabled when confirmation matches tag name", () => {
    render(<DeleteDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "v1.0.0" } })
    const button = screen.getByRole("button", { name: /delete tag/i })
    expect(button).not.toBeDisabled()
  })

  it("calls onConfirm with the tag when confirmed", () => {
    render(<DeleteDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "v1.0.0" } })
    const button = screen.getByRole("button", { name: /delete tag/i })
    fireEvent.click(button)
    expect(defaultProps.onConfirm).toHaveBeenCalledWith(tag)
  })

  it("submits on Enter key when confirmation is valid", () => {
    render(<DeleteDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "v1.0.0" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it("does not submit on Enter when confirmation is invalid", () => {
    render(<DeleteDialog {...defaultProps} />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "wrong" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(defaultProps.onConfirm).not.toHaveBeenCalled()
  })

  it("shows 'Deleting…' and disables button when isPending is true", () => {
    render(<DeleteDialog {...defaultProps} tag={tag} isPending />)
    const input = screen.getByPlaceholderText("v1.0.0")
    fireEvent.change(input, { target: { value: "v1.0.0" } })
    const button = screen.getByRole("button", { name: /deleting/i })
    expect(button).toBeDisabled()
  })

  it("shows shared digest warning when sharedWith is non-empty", () => {
    render(<DeleteDialog {...defaultProps} sharedWith={["v1.0.0-rc1", "v1-alias"]} />)
    expect(screen.getByText(/shared digest warning/i)).toBeInTheDocument()
    expect(screen.getByText("v1.0.0-rc1")).toBeInTheDocument()
    expect(screen.getByText("v1-alias")).toBeInTheDocument()
  })

  it("does not show shared digest warning when sharedWith is empty", () => {
    render(<DeleteDialog {...defaultProps} sharedWith={[]} />)
    expect(screen.queryByText(/shared digest warning/i)).not.toBeInTheDocument()
  })

  it("calls onOpenChange(false) when closed", () => {
    render(<DeleteDialog {...defaultProps} />)
    // Press Escape to close the dialog
    fireEvent.keyDown(document.body, { key: "Escape" })
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("renders nothing for tag content when tag is null", () => {
    render(<DeleteDialog {...defaultProps} tag={null} open />)
    // Input should not be present
    expect(screen.queryByPlaceholderText("v1.0.0")).not.toBeInTheDocument()
  })
})
