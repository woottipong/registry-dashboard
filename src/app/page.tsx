"use client"

import Link from "next/link"
import { DatabaseIcon, LayersIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RegistryOverview } from "@/components/dashboard/registry-overview"
import { Skeleton } from "@/components/ui/skeleton"
import { useMemo } from "react"

const TopReposChart = dynamic(
  () => import("@/components/dashboard/top-repos-chart").then((m) => m.TopReposChart),
  { loading: () => <Skeleton className="h-[250px] w-full border border-border rounded-md" />, ssr: false },
)
import { useRegistries } from "@/hooks/use-registries"
import { fetchRepositories } from "@/hooks/use-repositories"
import { useQueries } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"

import { motion } from "framer-motion"

export default function DashboardPage() {
  const registriesQuery = useRegistries()
  const registries = registriesQuery.data ?? []

  // Memoize the query configurations so useQueries doesn't see a new array reference on every render
  const repoQueryConfigs = useMemo(() => {
    return registries.map((registry) => ({
      queryKey: ["repositories", registry.id, 1, 50, ""],
      queryFn: () => fetchRepositories(registry.id, { perPage: 50 }),
      staleTime: STALE_TIME_REPOSITORIES,
    }))
  }, [registries])

  // Fetch repositories for ALL registries in parallel
  const repoQueries = useQueries({
    queries: repoQueryConfigs,
  })

  const isLoadingRegistries = registriesQuery.isLoading
  const isLoadingRepos = repoQueries.some((q) => q.isLoading)

  // Use useMemo to prevent recalculating stats on every minor re-render
  const { totalRepositories, totalTags, totalSizeBytes, chartData, registriesWithStats } = useMemo(() => {
    let tRepos = 0
    let tTags = 0
    let tSize = 0
    const allRepos: { name: string; registryId: string; tagCount: number }[] = []

    const regStats = registries.map((registry, index) => {
      const queryResult = repoQueries[index]
      const repos = queryResult?.data?.items ?? []
      
      const repoCount = repos.length
      const tagCount = repos.reduce((sum, r) => sum + (r.tagCount ?? 0), 0)
      
      tRepos += repoCount
      tTags += tagCount
      tSize += repos.reduce((sum, r) => sum + (r.sizeBytes ?? 0), 0)

      repos.forEach((r) => {
        if ((r.tagCount ?? 0) > 0) {
          allRepos.push({
            name: r.fullName,
            registryId: registry.id,
            tagCount: r.tagCount ?? 0,
          })
        }
      })

      return {
        ...registry,
        repoCount,
        tagCount
      }
    })

    const cData = allRepos.sort((a, b) => b.tagCount - a.tagCount).slice(0, 10)

    return {
      totalRepositories: tRepos,
      totalTags: tTags,
      totalSizeBytes: tSize,
      chartData: cData,
      registriesWithStats: regStats
    }
  }, [registries, repoQueries])

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] px-4 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/10 blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-md w-full text-center p-12 rounded-[2.5rem] border border-border/40 bg-card/40 backdrop-blur-md shadow-2xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="mx-auto h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex mb-8 shadow-inner">
            <LayersIcon className="size-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">Welcome to Registry Dashboard</h2>
          <p className="text-muted-foreground/80 mb-10 font-medium leading-relaxed">
            Connect your first Docker registry to start monitoring and managing your container images effortlessly.
          </p>
          <Button asChild size="lg" className="rounded-2xl px-10 h-14 text-base shadow-[0_8px_30px_rgba(99,102,241,0.25)] hover:shadow-[0_8px_40px_rgba(99,102,241,0.35)] hover:-translate-y-1 transition-all duration-300 bg-gradient-to-r from-primary to-primary/90">
            <Link href="/registries/new">Connect First Registry</Link>
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-10 max-w-[1200px] mx-auto pb-20 relative"
    >
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-chart-2/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 relative">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">System Overview</h1>
          <p className="text-muted-foreground/80 font-medium">Aggregated statistics and connections for your registries.</p>
        </div>
        {!isLoadingRegistries && registries.length > 0 && (
          <Button variant="outline" size="sm" asChild className="h-11 rounded-xl px-5 font-bold border-border/80 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md">
            <Link href="/registries/new">Add Connection</Link>
          </Button>
        )}
      </div>

      <StatsCards
        totalRegistries={isLoadingRegistries ? undefined : registries.length}
        totalRepositories={registries.length ? totalRepositories : undefined}
        totalTags={registries.length ? totalTags : undefined}
        totalSizeBytes={registries.length ? totalSizeBytes : undefined}
        isLoadingRegistries={isLoadingRegistries}
        isLoadingRepos={isLoadingRepos}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="space-y-5">
          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <DatabaseIcon className="size-4" />
            </div>
            <h2>Active Connections</h2>
          </div>
          <div className="rounded-[2rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm relative overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <RegistryOverview registries={registriesWithStats} isLoading={isLoadingRegistries} />
          </div>
        </section>

        {chartData.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">
              <div className="p-1.5 rounded-lg bg-chart-2/10 text-chart-2">
                <LayersIcon className="size-4" />
              </div>
              <h2>Inventory Distribution</h2>
            </div>
            <div className="rounded-[2rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-8 relative overflow-hidden min-h-[300px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
              <div className="w-full relative z-10">
                <TopReposChart data={chartData} isLoading={isLoadingRepos} />
              </div>
            </div>
          </section>
        )}
      </div>
    </motion.div>
  )
}
