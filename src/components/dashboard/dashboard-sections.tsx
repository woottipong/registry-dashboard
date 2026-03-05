"use client"

import { DatabaseIcon, LayersIcon, ActivityIcon } from "lucide-react"
import dynamic from "next/dynamic"
import { RegistryOverview } from "./registry-overview"
import { ActivityFeed } from "./activity-feed"

const TopReposChart = dynamic(
  () => import("./top-repos-chart").then((m) => m.TopReposChart),
  {
    loading: () => (
      <div className="w-full relative z-10 animate-pulse">
        <div className="h-[250px] w-full bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border/50 flex items-center justify-center">
          <div className="space-y-4 w-full px-8">
            <div className="flex justify-between items-end">
              <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
              <div className="h-6 bg-muted-foreground/20 rounded w-16"></div>
            </div>
            <div className="h-32 bg-muted-foreground/10 rounded"></div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  },
)

import type { RegistryProviderType, RegistryAuthType, ProviderCapabilities } from "@/types/registry"

interface RegistryWithStats {
  id: string
  name: string
  url: string
  provider: RegistryProviderType
  authType: RegistryAuthType
  credentials?: {
    username?: string
    password?: string
    token?: string
  }
  namespace?: string
  isDefault?: boolean
  capabilities?: ProviderCapabilities
  createdAt: string
  updatedAt?: string
  repoCount: number
  tagCount: number
  sizeBytes: number
}

interface RepoChartItem {
  name: string
  registryId: string
  tagCount: number
}

interface DashboardSectionsProps {
  registriesWithStats: RegistryWithStats[]
  chartData: RepoChartItem[]
  isLoadingRegistries: boolean
  isLoadingRepos: boolean
  activities: Array<{
    id: string
    type: 'push' | 'pull' | 'delete' | 'connect' | 'view' | 'inspect'
    repository: string
    registry: string
    tag?: string
    user?: string
    timestamp: Date
  }>
}

export function DashboardSections({
  registriesWithStats,
  chartData,
  isLoadingRegistries,
  isLoadingRepos,
  activities,
}: DashboardSectionsProps) {
  return (
    <div className="space-y-10">
      {/* Active Connections - Full width */}
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

      {/* Inventory Distribution - Full width on its own row */}
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

      {/* Activity Feed */}
      <section className="space-y-5">
        <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
            <ActivityIcon className="size-4" />
          </div>
          <h2>Recent Activity</h2>
        </div>
        <div className="rounded-[2rem] border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
          <ActivityFeed activities={activities} isLoading={false} />
        </div>
      </section>
    </div>
  )
}
