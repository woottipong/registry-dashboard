import { describe, it, expect, vi, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useDebounce } from "@/hooks/use-debounce"

vi.useFakeTimers()

afterEach(() => {
  vi.clearAllTimers()
})

describe("useDebounce", () => {
  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300))
    expect(result.current).toBe("hello")
  })

  it("does not update before the delay elapses", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe("a") // still old value
  })

  it("updates after the delay elapses", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("b")
  })

  it("resets the timer when value changes rapidly", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "a" },
    })

    rerender({ value: "b" })
    await act(async () => { vi.advanceTimersByTime(100) })

    rerender({ value: "c" })
    await act(async () => { vi.advanceTimersByTime(100) })

    rerender({ value: "d" })
    await act(async () => { vi.advanceTimersByTime(300) }) // final value fires

    expect(result.current).toBe("d")
  })

  it("uses 300ms as the default delay", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: "x" },
    })

    rerender({ value: "y" })

    await act(async () => { vi.advanceTimersByTime(299) })
    expect(result.current).toBe("x")

    await act(async () => { vi.advanceTimersByTime(1) })
    expect(result.current).toBe("y")
  })

  it("works with number values", async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 0 },
    })

    rerender({ value: 42 })

    await act(async () => { vi.advanceTimersByTime(200) })

    expect(result.current).toBe(42)
  })
})
