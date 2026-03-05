import { useSyncExternalStore } from "react"

const emptySubscribe = () => () => { }
const getSnapshot = () => true
const getServerSnapshot = () => false

/**
 * Hook to track when a component has mounted on the client
 * Useful for preventing hydration mismatches in SSR environments
 */
export function useMounted(): boolean {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
}
