"use client"

import Link from "next/link"
import { LayersIcon } from "lucide-react"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { DashboardSections } from "@/components/dashboard/dashboard-sections"
import { Button } from "@/components/ui/button"
import { useActivity } from "@/contexts/activity-context"
import { useDashboardData } from "@/hooks/use-dashboard-data"

export function DashboardClient() {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData()
  const { activities } = useActivity()

  const { totalRepositories, totalTags, totalSizeBytes, chartData, registriesWithStats } = dashboardData

  if (!isLoadingRegistries && registries.length === 0) {
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
        totalRegistries={isLoadingRegistries ? undefined : registries.length}
        totalRepositories={registries.length ? totalRepositories : undefined}
        totalTags={registries.length ? totalTags : undefined}
        totalSizeBytes={registries.length ? totalSizeBytes : undefined}
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
