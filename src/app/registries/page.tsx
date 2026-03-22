import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { ModernRegistriesPage } from "./modern-registries-page"
import { listRegistries } from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"
import { queryKeys } from "@/lib/constants/query-keys"

export const dynamic = "force-dynamic"

export default async function RegistriesPage() {
  const queryClient = new QueryClient()
  const registries = listRegistries().map(sanitizeRegistry)

  await queryClient.prefetchQuery({
    queryKey: queryKeys.registries.all,
    queryFn: () => registries,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ModernRegistriesPage />
    </HydrationBoundary>
  )
}
