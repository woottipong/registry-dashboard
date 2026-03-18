import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TagTable } from "@/components/tag/tag-table"
import type { Tag } from "@/types/registry"

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    tr: ({ children, layout: _layout, ...props }: React.ComponentProps<"tr"> & { layout?: boolean }) => <tr {...props}>{children}</tr>,
  },
}))

vi.mock("@/components/tag/tag-actions", () => ({
  TagActions: () => <div data-testid="tag-actions" />,
}))

const tags: Tag[] = [
  {
    name: "latest",
    digest: "sha256:111",
    size: 100,
    createdAt: "2024-01-01T00:00:00Z",
    architecture: "amd64",
    os: "linux",
  },
  {
    name: "stable",
    digest: "sha256:222",
    size: 200,
    createdAt: "2024-01-02T00:00:00Z",
    architecture: "arm64",
    os: "linux",
  },
]

describe("TagTable", () => {
  it("uses stable tag names for row selection keys", () => {
    const onRowSelectionChange = vi.fn()

    render(
      <TagTable
        registryId="reg-1"
        repoName="library/nginx"
        tags={tags}
        canDelete
        rowSelection={{}}
        onRowSelectionChange={onRowSelectionChange}
        onDeleteClick={vi.fn()}
      />,
    )

    const checkboxes = screen.getAllByRole("checkbox")
    fireEvent.click(checkboxes[2])

    expect(onRowSelectionChange).toHaveBeenCalledWith({ stable: true })
  })
})
