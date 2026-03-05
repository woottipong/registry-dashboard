import { useState, useEffect } from "react"

/**
 * Hook to track when a component has mounted on the client
 * Useful for preventing hydration mismatches in SSR environments
 */
export function useMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
}
