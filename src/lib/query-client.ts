import { QueryClient } from "@tanstack/react-query"

const STALE_TIME_REGISTRIES = 30 * 1000
const STALE_TIME_REPOSITORIES = 2 * 60 * 1000 // 2 minutes - longer for repositories to enable SWR
const STALE_TIME_TAGS = 30 * 1000
const STALE_TIME_MANIFEST = 10 * 60 * 1000 // manifests are immutable

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_REGISTRIES,
        // Don't retry on 4xx errors (auth failed, not found, etc.)
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.startsWith("4")) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: (query) => {
          // Don't refetch immutable manifests on window focus
          const queryKey = query.queryKey
          if (Array.isArray(queryKey) && queryKey[0] === "manifest") {
            return false
          }
          return true
        },
      },
    },
  })
}

// Stale time constants exported for per-query overrides
export {
  STALE_TIME_REGISTRIES,
  STALE_TIME_REPOSITORIES,
  STALE_TIME_TAGS,
  STALE_TIME_MANIFEST,
}
