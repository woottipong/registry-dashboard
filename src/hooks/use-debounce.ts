import { useState, useEffect } from "react"

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * have elapsed since the last call. Cleans up the timer on unmount.
 */
export function useDebounce<T>(value: T, delay = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}
