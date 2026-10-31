"use client"

import Link from "next/link"
import { ArrowRightIcon, DatabaseIcon, FolderIcon, ServerIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export interface DashboardKpisProps {
  registryCount: number
  totalRepositories: number
  totalTags: number
  providerCount: number
  isLoadingRegistries: boolean
  isLoadingRepos: boolean
  hasIncompleteData?: boolean
  hasUnknownTagCounts?: boolean
}

export function DashboardKpis({
  registryCount,
  totalRepositories,
  totalTags,
  providerCount,
  isLoadingRegistries,
  isLoadingRepos,
  hasIncompleteData,
  hasUnknownTagCounts,
}: DashboardKpisProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
      {/* Card 1: Registries */}
      <Link
        href="/registries"
        className="group rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-all hover:border-primary/40 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
            <DatabaseIcon className="size-3.5 text-primary" />
            {"Registries"}
          </span>
          <ArrowRightIcon className="size-3 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries ? (
            <Skeleton className="h-8 w-12 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl font-mono">
              {registryCount}
            </span>
          )}
        </div>
      </Link>

      {/* Card 2: Repositories */}
      <Link
        href="/repos"
        className="group rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-all hover:border-primary/40 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
            <FolderIcon className="size-3.5 text-primary" />
            {"Repositories"}
          </span>
          <ArrowRightIcon className="size-3 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries || isLoadingRepos ? (
            <Skeleton className="h-8 w-14 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl font-mono">
              {hasIncompleteData ? (totalRepositories > 0 ? `${totalRepositories}+` : "—") : totalRepositories}
            </span>
          )}
        </div>
      </Link>

      {/* Card 3: Image Tags */}
      <Link
        href="/repos"
        className="group rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-all hover:border-primary/40 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
            <TagIcon className="size-3.5 text-primary" />
            {"Image Tags"}
          </span>
          <ArrowRightIcon className="size-3 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries || isLoadingRepos ? (
            <Skeleton className="h-8 w-14 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl font-mono">
              {hasUnknownTagCounts || hasIncompleteData ? (totalTags > 0 ? `${totalTags}+` : "—") : totalTags}
            </span>
          )}
        </div>
      </Link>

      {/* Card 4: Providers */}
      <Link
        href="/registries"
        className="group rounded-panel border border-panel-border bg-card p-4 shadow-panel transition-all hover:border-primary/40 hover:bg-card/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
          <span className="flex items-center gap-1.5 group-hover:text-foreground transition-colors">
            <ServerIcon className="size-3.5 text-primary" />
            {"Providers"}
          </span>
          <ArrowRightIcon className="size-3 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          {isLoadingRegistries ? (
            <Skeleton className="h-8 w-10 rounded-control" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl font-mono">
              {providerCount}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}

