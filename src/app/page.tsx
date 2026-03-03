"use client"

import Link from "next/link"
import { DatabaseIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RegistryOverview } from "@/components/dashboard/registry-overview"
import { Skeleton } from "@/components/ui/skeleton"

const TopReposChart = dynamic(
  () => import("@/components/dashboard/top-repos-chart").then((m) => m.TopReposChart),
  { loading: () => <Skeleton className="h-[250px] w-full border border-border rounded-md" />, ssr: false },
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
    .slice(0, 5)
    .map((r) => ({
      name: r.fullName,
      registryId: primaryRegistry?.id ?? "",
      tagCount: r.tagCount ?? 0,
    }))

  const isLoading = registriesQuery.isLoading

  if (!isLoading && registries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted mb-4">
            <LayersIcon className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight mb-2">No registries connected</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Get started by connecting your first Docker registry. Supported providers include Docker Hub, GitHub CR, and Private Registries.
          </p>
          <Button asChild>
            <Link href="/registries/new">Connect Registry</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        </div>
        {!isLoading && registries.length > 0 && (
          <Button variant="outline" size="sm" asChild className="h-8">
            <Link href="/registries/new">Add Registry</Link>
          </Button>
        )}
      </div>

      <StatsCards data={statsData} isLoading={isLoading} />

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium border-b pb-2">
          <DatabaseIcon className="size-4" />
          <h2>Connections</h2>
        </div>
        <RegistryOverview registries={registries} isLoading={isLoading} />
      </section>

      {chartData.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium border-b pb-2">
            <h2>Top Repositories</h2>
          </div>
          <div className="border border-border rounded-md p-4 pt-6 bg-card">
            <TopReposChart data={chartData} isLoading={reposQuery.isLoading} />
          </div>
        </section>
      )}
    </div>
  )
}
