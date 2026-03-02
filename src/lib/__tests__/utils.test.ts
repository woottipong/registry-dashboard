import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-8")).toBe("p-8")
  })

  it("handles undefined and null gracefully", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b")
  })

  it("handles array inputs", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })

  it("handles object notation", () => {
    expect(cn({ active: true, inactive: false })).toBe("active")
  })

  it("returns empty string for no args", () => {
    expect(cn()).toBe("")
  })
})
