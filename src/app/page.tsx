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

import { motion } from "framer-motion"

export default function DashboardPage() {
  const registriesQuery = useRegistries()
  const registries = registriesQuery.data ?? []

  const primaryRegistry = registries[0]
  const reposQuery = useRepositories(primaryRegistry?.id ?? "", { perPage: 50 })
  const repos = reposQuery.data?.items ?? []

  const chartData = repos
    .filter((r) => (r.tagCount ?? 0) > 0)
    .sort((a, b) => (b.tagCount ?? 0) - (a.tagCount ?? 0))
    .slice(0, 10)
    .map((r) => ({
      name: r.fullName,
      registryId: primaryRegistry?.id ?? "",
      tagCount: r.tagCount ?? 0,
    }))

  const isLoadingRegistries = registriesQuery.isLoading

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-4"
      >
        <div className="max-w-md w-full text-center p-12 rounded-3xl border border-dashed border-border/50 bg-card/20 backdrop-blur-sm">
          <div className="mx-auto h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 flex mb-6">
            <LayersIcon className="size-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-3">Welcome to Registry Dashboard</h2>
          <p className="text-muted-foreground mb-8">
            Connect your first Docker registry to start monitoring and managing your container images effortlessly.
          </p>
          <Button asChild size="lg" className="rounded-2xl px-8 shadow-xl shadow-primary/20">
            <Link href="/registries/new">Connect First Registry</Link>
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 max-w-[1200px] mx-auto pb-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
          <p className="text-muted-foreground">Aggregated statistics and connections for your registries.</p>
        </div>
        {!isLoadingRegistries && registries.length > 0 && (
          <Button variant="outline" size="sm" asChild className="h-10 rounded-xl px-4 font-semibold border-primary/20 hover:bg-primary/5 text-primary">
            <Link href="/registries/new">Add Connection</Link>
          </Button>
        )}
      </div>

      <StatsCards
        totalRegistries={isLoadingRegistries ? undefined : registries.length}
        totalRepositories={repos.length || undefined}
        totalTags={repos.length ? repos.reduce((sum, r) => sum + (r.tagCount ?? 0), 0) : undefined}
        totalSizeBytes={repos.length ? repos.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0) : undefined}
        isLoadingRegistries={isLoadingRegistries}
        isLoadingRepos={reposQuery.isLoading}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">
            <DatabaseIcon className="size-3.5" />
            <h2>Active Connections</h2>
          </div>
          <div className="rounded-3xl border border-border/50 bg-card/30 p-2 backdrop-blur-sm overflow-hidden min-h-[300px]">
            <RegistryOverview registries={registries} isLoading={isLoadingRegistries} />
          </div>
        </section>

        {chartData.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 px-2">
              <h2>Inventory Distribution</h2>
            </div>
            <div className="rounded-3xl border border-border/50 bg-card/30 p-8 backdrop-blur-sm min-h-[300px] flex items-center justify-center">
              <TopReposChart data={chartData} isLoading={reposQuery.isLoading} />
            </div>
          </section>
        )}
      </div>
    </motion.div>
  )
}
