import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { ModernDashboardClient } from "./modern-dashboard-client"
import { listRegistries } from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"
import { queryKeys } from "@/lib/constants/query-keys"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard | Registry UI",
  description: "Overview of your Docker registries and repositories",
}

export default async function DashboardPage() {
  const queryClient = new QueryClient()
  const registries = listRegistries().map(sanitizeRegistry)

  await queryClient.prefetchQuery({
    queryKey: queryKeys.registries.all,
    queryFn: () => registries,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ModernDashboardClient initialRegistries={registries} />
    </HydrationBoundary>
  )
}
