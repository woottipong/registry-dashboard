import { describe, it, expect, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useRegistryStore } from "@/stores/registry-store"
import type { RegistryConnection } from "@/types/registry"

function makeRegistry(overrides: Partial<RegistryConnection> = {}): RegistryConnection {
  return {
    id: `reg-${Math.random().toString(36).slice(2)}`,
    name: "Test Registry",
    url: "http://registry.local:5000",
    provider: "generic",
    authType: "none",
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("useRegistryStore", () => {
  beforeEach(() => {
    // Reset store state between tests
    act(() => {
      useRegistryStore.setState({ registries: [] })
    })
  })

  it("starts with an empty registry list", () => {
    const { result } = renderHook(() => useRegistryStore())
    expect(result.current.registries).toHaveLength(0)
  })

  it("addRegistry appends a registry", () => {
    const { result } = renderHook(() => useRegistryStore())
    const reg = makeRegistry()

    act(() => {
      result.current.addRegistry(reg)
    })

    expect(result.current.registries).toHaveLength(1)
    expect(result.current.registries[0].id).toBe(reg.id)
  })

  it("removeRegistry removes by id", () => {
    const { result } = renderHook(() => useRegistryStore())
    const reg = makeRegistry()

    act(() => {
      result.current.addRegistry(reg)
    })
    act(() => {
      result.current.removeRegistry(reg.id)
    })

    expect(result.current.registries).toHaveLength(0)
  })

  it("updateRegistry merges changes", () => {
    const { result } = renderHook(() => useRegistryStore())
    const reg = makeRegistry({ name: "Old Name" })

    act(() => {
      result.current.addRegistry(reg)
    })
    act(() => {
      result.current.updateRegistry(reg.id, { name: "New Name" })
    })

    expect(result.current.registries[0].name).toBe("New Name")
  })

  it("updateRegistry sets updatedAt", () => {
    const { result } = renderHook(() => useRegistryStore())
    const reg = makeRegistry()

    act(() => {
      result.current.addRegistry(reg)
    })
    act(() => {
      result.current.updateRegistry(reg.id, { name: "Changed" })
    })

    expect(result.current.registries[0].updatedAt).toBeDefined()
  })

  it("setDefault marks only the specified registry as default", () => {
    const { result } = renderHook(() => useRegistryStore())
    const reg1 = makeRegistry({ id: "r1" })
    const reg2 = makeRegistry({ id: "r2" })

    act(() => {
      result.current.addRegistry(reg1)
      result.current.addRegistry(reg2)
    })
    act(() => {
      result.current.setDefault("r1")
    })

    const [r1, r2] = result.current.registries
    expect(r1.isDefault).toBe(true)
    expect(r2.isDefault).toBe(false)
  })
})
