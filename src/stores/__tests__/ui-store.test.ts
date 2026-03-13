import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useUiStore } from "@/stores/ui-store"

describe("useUiStore", () => {
  beforeEach(() => {
    act(() => {
      useUiStore.setState({
        sidebarOpen: false,
        sidebarCollapsed: false,
        repoViewMode: "grid",
      })
    })
  })

  it("has expected initial state", () => {
    const { result } = renderHook(() => useUiStore())
    expect(result.current.repoViewMode).toBe("grid")
    expect(result.current.sidebarCollapsed).toBe(false)
  })

  it("setRepoViewMode toggles between grid and table", () => {
    const { result } = renderHook(() => useUiStore())

    act(() => result.current.setRepoViewMode("table"))
    expect(result.current.repoViewMode).toBe("table")

    act(() => result.current.setRepoViewMode("grid"))
    expect(result.current.repoViewMode).toBe("grid")
  })

  it("setSidebarOpen updates sidebarOpen", () => {
    const { result } = renderHook(() => useUiStore())

    act(() => result.current.setSidebarOpen(true))
    expect(result.current.sidebarOpen).toBe(true)
  })

  it("toggleSidebarCollapsed flips sidebarCollapsed", () => {
    const { result } = renderHook(() => useUiStore())

    act(() => result.current.toggleSidebarCollapsed())
    expect(result.current.sidebarCollapsed).toBe(true)

    act(() => result.current.toggleSidebarCollapsed())
    expect(result.current.sidebarCollapsed).toBe(false)
  })
})
