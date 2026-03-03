import { QueryClient } from "@tanstack/react-query"

// Stale time defaults — registry data changes infrequently
const STALE_TIME_REGISTRY = 5 * 60 * 1000 // 5 minutes
const STALE_TIME_MANIFEST = 10 * 60 * 1000 // 10 minutes (manifests are immutable)

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        // Don't retry on 4xx errors (auth failed, not found, etc.)
        retry: (failureCount, error) => {
          if (error instanceof Error && error.message.startsWith("4")) return false
          return failureCount < 2
        },
        refetchOnWindowFocus: true,
      },
    },
  })
}

// Stale time constants exported for per-query overrides
export { STALE_TIME_REGISTRY, STALE_TIME_MANIFEST }
