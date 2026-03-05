"use client"

import Link from "next/link"
import { LayersIcon } from "lucide-react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardSections } from "@/components/dashboard/dashboard-sections"
import { Button } from "@/components/ui/button"
import { useMemo } from "react"
import { useRegistries } from "@/hooks/use-registries"
import { useQueries } from "@tanstack/react-query"
import { STALE_TIME_REPOSITORIES } from "@/lib/query-client"
import { fetchRepositories } from "@/hooks/use-repositories"
import { useActivity } from "@/contexts/activity-context"

export function DashboardClient() {
  const registriesQuery = useRegistries()
  const memoizedRegistries = useMemo(() => registriesQuery.data ?? [], [registriesQuery.data])
  const { activities } = useActivity()

  // Fetch repositories with pagination and lazy loading
  const repoQueryConfigs = useMemo(() => {
    return memoizedRegistries.map((registry) => ({
      queryKey: ["repositories", registry.id, 1, 20, ""], // Reduced from 50 to 20 for better performance
      queryFn: () => fetchRepositories(registry.id, { perPage: 20 }), // Reduced page size
      staleTime: STALE_TIME_REPOSITORIES,
      enabled: memoizedRegistries.length > 0, // Only fetch when registries are loaded
    }))
  }, [memoizedRegistries])

  // Progressive loading: Load basic data first, then detailed stats
  const repoQueries = useQueries({
    queries: repoQueryConfigs,
  })

  const isLoadingRegistries = registriesQuery.isLoading
  const isLoadingRepos = repoQueries.some((q) => q.isLoading)

  // Optimize stats calculation with better memoization
  const { totalRepositories, totalTags, totalSizeBytes, chartData, registriesWithStats } = useMemo(() => {
    // Early return if no data yet
    if (memoizedRegistries.length === 0) {
      return {
        totalRepositories: 0,
        totalTags: 0,
        totalSizeBytes: 0,
        chartData: [],
        registriesWithStats: []
      }
    }

    const allRepos: { name: string; registryId: string; tagCount: number }[] = []
    let totalRepos = 0
    let totalTagsCount = 0
    let totalSize = 0

    const regStats = memoizedRegistries.map((registry, index) => {
      const queryResult = repoQueries[index]

      // If query is still loading, use cached or partial data
      const repos = queryResult?.data?.items ?? []
      const repoCount = repos.length
      const tagCount = repos.reduce((sum: number, r: any) => sum + (r.tagCount ?? 0), 0)
      const sizeBytes = repos.reduce((sum: number, r: any) => sum + (r.sizeBytes ?? 0), 0)

      // Only add to chart data if we have repositories
      if (repoCount > 0) {
        repos.forEach((r: any) => {
          if ((r.tagCount ?? 0) > 0) {
            allRepos.push({
              name: r.fullName,
              registryId: registry.id,
              tagCount: r.tagCount ?? 0,
            })
          }
        })
      }

      totalRepos += repoCount
      totalTagsCount += tagCount
      totalSize += sizeBytes

      return {
        ...registry,
        repoCount,
        tagCount,
        sizeBytes
      }
    })

    // Sort and limit chart data for better performance
    const sortedChartData = allRepos
      .sort((a, b) => b.tagCount - a.tagCount)
      .slice(0, 10) // Limit to top 10 for chart performance

    return {
      totalRepositories: totalRepos,
      totalTags: totalTagsCount,
      totalSizeBytes: totalSize,
      chartData: sortedChartData,
      registriesWithStats: regStats
    }
  }, [memoizedRegistries, repoQueries])

  if (!isLoadingRegistries && memoizedRegistries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 relative animate-in fade-in duration-500">
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
      </div>
    )
  }

  return (
    <div className="space-y-10 max-w-[1200px] mx-auto pb-20 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-chart-2/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 relative">
        <div className="space-y-1.5">
          <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60">System Overview</h1>
          <p className="text-muted-foreground/80 font-medium">Aggregated statistics and connections for your registries.</p>
        </div>
      </div>

      <StatsCards
        totalRegistries={isLoadingRegistries ? undefined : memoizedRegistries.length}
        totalRepositories={memoizedRegistries.length ? totalRepositories : undefined}
        totalTags={memoizedRegistries.length ? totalTags : undefined}
        totalSizeBytes={memoizedRegistries.length ? totalSizeBytes : undefined}
        isLoadingRegistries={isLoadingRegistries}
        isLoadingRepos={isLoadingRepos}
      />

      <DashboardSections
        registriesWithStats={registriesWithStats}
        chartData={chartData}
        isLoadingRegistries={isLoadingRegistries}
        isLoadingRepos={isLoadingRepos}
        activities={activities}
      />
    </div>
  )
}
