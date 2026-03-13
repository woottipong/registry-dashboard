import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { TagExplorerClient } from "./tag-explorer-client"
import { listRegistries } from "@/lib/registry-store"
import { createProvider } from "@/lib/providers"
import { queryKeys } from "@/lib/constants/query-keys"

export const metadata = {
  title: "Tag Explorer | Registry UI",
  description: "Browse and manage tags for a specific Docker repository",
}

interface TagExplorerPageProps {
  params: Promise<{ registry: string; name: string[] }>
}

export default async function TagExplorerPage({ params }: TagExplorerPageProps) {
  const queryClient = new QueryClient()
  const { registry: registryId, name: nameParts } = await params
  const repoName = nameParts.join("/")

  const registries = listRegistries()
  const registry = registries.find((r) => r.id === registryId)

  // 1. Prefetch the specific registry
  if (registry) {
    const registryWithCaps = {
      ...registry,
      capabilities: createProvider(registry).capabilities(),
    }
    await queryClient.prefetchQuery({
      queryKey: queryKeys.registries.byId(registryId),
      queryFn: () => registryWithCaps,
    })

    // 2. Prefetch tags for this repository
    const provider = createProvider(registry)
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tags.byRepo(registryId, repoName, 1, 100),
      queryFn: async () => {
        try {
          const result = await provider.listTags(repoName, { perPage: 100, page: 1 })
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
          console.error(`Failed to prefetch tags for ${registryId}/${repoName}:`, error)
          return { items: [], meta: undefined }
        }
      },
    })
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TagExplorerClient registryId={registryId} repoName={repoName} />
    </HydrationBoundary>
  )
}
