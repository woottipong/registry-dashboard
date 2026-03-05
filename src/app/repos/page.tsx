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

  // 3. Prefetch namespaces (catalog names only — fast, no per-repo tag fetches)
  if (selectedRegistry) {
    const registry = registries.find(r => r.id === selectedRegistry)
    if (registry) {
      const provider = createProvider(registry)
      await queryClient.prefetchQuery({
        queryKey: ["namespaces", selectedRegistry],
        queryFn: async () => {
          try {
            return await provider.listNamespaces()
          } catch (error) {
            console.error(`Failed to prefetch namespaces for ${selectedRegistry}:`, error)
            return []
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
