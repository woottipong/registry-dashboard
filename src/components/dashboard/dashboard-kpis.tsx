"use client"

import { DatabaseIcon, FolderIcon, ServerIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface DashboardKpisProps {
  registryCount: number
  totalRepositories: number
  totalTags: number
  providerCount: number
  isLoadingRegistries: boolean
  isLoadingRepos: boolean
}

export function DashboardKpis({
  registryCount,
  totalRepositories,
  totalTags,
  providerCount,
  isLoadingRegistries,
  isLoadingRepos,
}: DashboardKpisProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {/* Card 1: Registries */}
      <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-colors">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <DatabaseIcon className="size-3.5 text-primary" />
            {"Registries"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries ? (
            <Skeleton className="h-8 w-12 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {registryCount}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Repositories */}
      <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-colors">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <FolderIcon className="size-3.5 text-primary" />
            {"Repositories"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries || isLoadingRepos ? (
            <Skeleton className="h-8 w-14 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {totalRepositories}
            </span>
          )}
        </div>
      </div>

      {/* Card 3: Image Tags */}
      <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-colors">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <TagIcon className="size-3.5 text-primary" />
            {"Image Tags"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries || isLoadingRepos ? (
            <Skeleton className="h-8 w-14 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {totalTags}
            </span>
          )}
        </div>
      </div>

      {/* Card 4: Providers */}
      <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-colors">
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <ServerIcon className="size-3.5 text-primary" />
            {"Providers"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries ? (
            <Skeleton className="h-8 w-10 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
              {providerCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

