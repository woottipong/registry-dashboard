import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { RepositoriesClient } from "./repos-client"
import { listRegistries } from "@/lib/registry-store"
import { createProvider } from "@/lib/providers"

export const metadata = {
  title: "Repositories | Registry UI",
  description: "Browse Docker repositories",
}

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const queryClient = new QueryClient()
  const resolvedSearchParams = await searchParams
  const registryParam = typeof resolvedSearchParams.registry === 'string' ? resolvedSearchParams.registry : undefined

  // 1. Fetch registries
  const registries = listRegistries().map((registry) => ({
    ...registry,
    capabilities: createProvider(registry).capabilities(),
  }))

  await queryClient.prefetchQuery({
    queryKey: ["registries"],
    queryFn: () => registries,
  })

  // 2. Figure out selected registry
  const defaultRegistry = registries.find((r) => r.isDefault)
  const selectedRegistry = registryParam ?? defaultRegistry?.id ?? registries[0]?.id ?? ""

  // 3. Prefetch repositories for the selected registry if available
  if (selectedRegistry) {
    const registry = registries.find(r => r.id === selectedRegistry)
    if (registry) {
      const provider = createProvider(registry)
      await queryClient.prefetchQuery({
        queryKey: ["repositories", selectedRegistry, 1, 25, ""],
        queryFn: async () => {
          try {
            const result = await provider.listRepositories({ perPage: 25, page: 1 })
            return {
              items: result.items,
              meta: {
                page: result.page,
                perPage: result.perPage,
                total: result.total ?? 0,
                totalPages: result.total ? Math.ceil(result.total / result.perPage) : 1
              },
            }
          } catch (error) {
            console.error(`Failed to prefetch repositories for ${selectedRegistry}:`, error)
            return { items: [], meta: undefined }
          }
        },
      })
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RepositoriesClient initialRegistry={selectedRegistry} initialRegistries={registries} />
    </HydrationBoundary>
  )
}
