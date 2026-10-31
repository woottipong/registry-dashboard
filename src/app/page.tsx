import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { ModernDashboardClient } from "./modern-dashboard-client"
import { listRegistries } from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"
import { listActivities } from "@/lib/activity-store"
import { queryKeys } from "@/lib/constants/query-keys"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Dashboard | Registry UI",
  description: "Overview of your Docker registries and repositories",
}

export default async function DashboardPage() {
  const queryClient = new QueryClient()
  const registries = listRegistries().map(sanitizeRegistry)
  const activities = listActivities().slice(0, 50)

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.registries.all,
      queryFn: () => registries,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.activities.all,
      queryFn: () => activities,
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ModernDashboardClient initialRegistries={registries} />
    </HydrationBoundary>
  )
}
