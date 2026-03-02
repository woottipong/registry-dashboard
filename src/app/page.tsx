"use client"

import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RegistryOverview } from "@/components/dashboard/registry-overview"
import { Skeleton } from "@/components/ui/skeleton"

const TopReposChart = dynamic(
  () => import("@/components/dashboard/top-repos-chart").then((m) => m.TopReposChart),
  { loading: () => <Skeleton className="h-64 w-full rounded-lg" />, ssr: false },
)
import { useRegistries } from "@/hooks/use-registries"
import { useRepositories } from "@/hooks/use-repositories"

export default function DashboardPage() {
  const registriesQuery = useRegistries()
  const registries = registriesQuery.data ?? []

  const primaryRegistry = registries[0]
  const reposQuery = useRepositories(primaryRegistry?.id ?? "", { perPage: 50 })
  const repos = reposQuery.data?.items ?? []

  const statsData = registries.length
    ? {
        totalRegistries: registries.length,
        totalRepositories: repos.length,
        totalTags: repos.reduce((sum, r) => sum + (r.tagCount ?? 0), 0),
        totalSizeBytes: repos.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0),
      }
    : undefined

  const chartData = repos
    .filter((r) => (r.tagCount ?? 0) > 0)
    .sort((a, b) => (b.tagCount ?? 0) - (a.tagCount ?? 0))
    .map((r) => ({
      name: r.fullName,
      registryId: primaryRegistry?.id ?? "",
      tagCount: r.tagCount ?? 0,
    }))

  const isLoading = registriesQuery.isLoading

  if (!isLoading && registries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="rounded-xl border border-dashed p-10">
          <h2 className="text-xl font-semibold">No registries connected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a registry to start browsing container images.
          </p>
          <Button asChild className="mt-6">
            <Link href="/registries/new">
              <PlusIcon className="size-4" />
              Add Registry
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your connected registries.</p>
      </div>

      <StatsCards data={statsData} isLoading={isLoading} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Registries</h2>
        <RegistryOverview registries={registries} isLoading={isLoading} />
      </section>

      {chartData.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold">Top Repositories</h2>
          <TopReposChart data={chartData} isLoading={reposQuery.isLoading} />
        </section>
      ) : null}
    </div>
  )
}
