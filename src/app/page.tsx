import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { DashboardClient } from "./dashboard-client"
import { listRegistries } from "@/lib/registry-store"
import { createProvider } from "@/lib/providers"

export const metadata = {
  title: "Dashboard | Registry UI",
  description: "Overview of your Docker registries and repositories",
}

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  // 1. Fetch registries directly from the store
  const registries = listRegistries().map((registry) => ({
    ...registry,
    capabilities: createProvider(registry).capabilities(),
  }))

  // 2. Prefetch the registries query
  await queryClient.prefetchQuery({
    queryKey: ["registries"],
    queryFn: () => registries,
  })

  // 3. Prefetch the repositories for each registry in parallel
  // Note: we're only prefetching the first page, same as the client
  await Promise.all(
    registries.map((registry) => {
      const provider = createProvider(registry)
      return queryClient.prefetchQuery({
        queryKey: ["repositories", registry.id, 1, 50, ""],
        queryFn: async () => {
          try {
            const result = await provider.listRepositories({ perPage: 50 })
            // Re-map it to match API response format (simulating fetchRepositories)
            return {
              items: result.items,
              meta: {
                page: result.page,
                perPage: result.perPage,
                total: result.total ?? 0,
              },
            }
          } catch (error) {
            console.error(`Failed to prefetch repositories for ${registry.id}:`, error)
            return { items: [], meta: undefined }
          }
        },
      })
    })
  )

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
