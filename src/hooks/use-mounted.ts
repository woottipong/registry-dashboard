import { useEffect, useState } from "react"

/**
 * Hook to track when a component has mounted on the client.
 * Intentionally uses two-pass rendering (initial state false matching SSR,
 * effect switches to true post-hydration) to avoid SSR hydration mismatches.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return mounted
}
