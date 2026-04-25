"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  BadgePlusIcon,
  DatabaseIcon,
  FolderIcon,
  TagIcon,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData({
    initialRegistries,
  })

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size
  const maxRegistryRepos = Math.max(...registriesWithStats.map((registry) => registry.repoCount), 1)
  const maxRegistryTags = Math.max(...registriesWithStats.map((registry) => registry.tagCount), 1)
  const maxRepoTags = Math.max(...chartData.map((repo) => repo.tagCount), 1)

  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="rounded-[24px] border border-border/70 bg-card/95 px-5 py-5 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
          <div className="space-y-2">
            <h1 className="text-[2rem] font-semibold tracking-tight">Dashboard</h1>
            <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
              Connect at least one registry to unlock live inventory and repository ranking across your fleet.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="sm" asChild>
              <Link href="/registries/new">
                <BadgePlusIcon data-icon="inline-start" />
                Connect Registry
              </Link>
            </Button>
          </div>
        </div>

        <EmptyState
          icon={<DatabaseIcon className="size-5" />}
          title="No registry telemetry yet"
          description="Add your first registry to turn this screen into a live operations dashboard."
          action={
            <Button asChild>
              <Link href="/registries/new">Connect Registry</Link>
            </Button>
          }
          className="rounded-[24px] border-border/70 bg-card/92 p-14"
        />
      </section>
    )
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <Card className="overflow-hidden rounded-[24px] border-border/70 bg-card/95 py-0 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
        <CardContent className="space-y-4 px-5 py-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <CardTitle className="text-[1.7rem] tracking-tight">Dashboard</CardTitle>
              <p className="max-w-xl text-sm leading-5 text-muted-foreground">
                A live operational view of registry inventory and the repositories pulling the most tag activity right now.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <CompactMetric
                label="Registries"
                value={isLoadingRegistries ? null : String(registries.length)}
                note={`${providerCount} providers`}
                icon={<DatabaseIcon className="size-4 text-muted-foreground" />}
              />
              <CompactMetric
                label="Repositories"
                value={isLoadingRegistries || isLoadingRepos ? null : String(totalRepositories)}
                note="Tracked across all connected registries"
                icon={<FolderIcon className="size-4 text-muted-foreground" />}
              />
              <CompactMetric
                label="Tags"
                value={isLoadingRegistries || isLoadingRepos ? null : String(totalTags)}
                note="Fleet total"
                icon={<TagIcon className="size-4 text-muted-foreground" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DashboardPanel
          title="Inventory by Registry"
          description="Compare repository breadth and tag depth across connected registries."
        >
          {isLoadingRegistries ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <RegistryDensitySkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {registriesWithStats.map((registry) => {
                const repoWidth = Math.max(8, Math.round((registry.repoCount / maxRegistryRepos) * 100))
                const tagWidth = Math.max(8, Math.round((registry.tagCount / maxRegistryTags) * 100))

                return (
                  <Link
                    key={registry.id}
                    href={`/repos?registry=${registry.id}`}
                    className="group block rounded-[20px] border border-border/70 bg-background/72 px-4 py-4 transition-colors hover:bg-background"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-semibold tracking-tight">{registry.name}</p>
                            {registry.isDefault ? (
                              <Badge className="border-primary/10 bg-primary/10 text-primary shadow-none hover:bg-primary/10">
                                Default
                              </Badge>
                            ) : null}
                            <RegistryPill label={registry.provider === "dockerhub" ? "Docker Hub" : "Registry V2"} />
                          </div>
                          <p className="truncate font-mono text-[13px] text-muted-foreground">{registry.url}</p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <RegistryPill label={`${registry.repoCount} repos`} />
                          <RegistryPill label={`${registry.tagCount} tags`} />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <ComparisonMetric
                          label="Repositories"
                          value={registry.repoCount}
                          width={repoWidth}
                        />
                        <ComparisonMetric
                          label="Tags"
                          value={registry.tagCount}
                          width={tagWidth}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Highest Tag Volume"
          description="Ranked by tag volume across the fleet."
        >
          {isLoadingRegistries || isLoadingRepos ? (
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <RepositoryRankSkeleton key={index} />
              ))}
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={<FolderIcon className="size-5" />}
              title="No repository data yet"
              description="Repository ranking will appear once tags have been indexed."
              className="rounded-[20px] border-border/70 bg-background/72"
            />
          ) : (
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
              {chartData.map((repo, index) => {
                const registry = registriesWithStats.find((item) => item.id === repo.registryId)
                const intensity = Math.max(12, Math.round((repo.tagCount / maxRepoTags) * 100))
                const rankTone = getRankTone(index)

                return (
                  <Link
                    key={`${repo.registryId}-${repo.name}`}
                    href={`/repos/${repo.registryId}/${repo.name}`}
                    className={`group block rounded-[18px] border px-4 py-3 transition-colors hover:bg-background ${rankTone.cardClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${rankTone.rankClass}`}>
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="space-y-1">
                          <p className="truncate text-sm font-semibold tracking-tight">{repo.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {registry?.name ?? repo.registryId}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            <span>Tag volume</span>
                            <span>{repo.tagCount}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary/80">
                            <div
                              className="h-1.5 rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${intensity}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </DashboardPanel>
      </div>
    </section>
  )
}

function DashboardPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-[24px] border-border/70 bg-card/95 py-0 shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
      <CardHeader className="gap-1 px-5 pb-4 pt-5">
        <div className="space-y-1">
          <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-0">{children}</CardContent>
    </Card>
  )
}

function CompactMetric({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: string | null
  note: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-[18px] border border-border/70 bg-background/72 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </p>
        {icon}
      </div>
      <div className="mt-2 space-y-1">
        {value === null ? (
          <Skeleton className="h-6 w-16" />
        ) : (
          <p className="font-mono text-base font-semibold tracking-tight text-foreground">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </div>
  )
}

function ComparisonMetric({
  label,
  value,
  width,
}: {
  label: string
  value: number
  width: number
}) {
  return (
    <div className="space-y-2 rounded-[16px] border border-border/70 bg-card/75 px-3 py-3">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span>{label}</span>
        <span className="font-mono text-foreground/80">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/80">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function RegistryPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-foreground/72">
      {label}
    </span>
  )
}

function getRankTone(index: number) {
  // Critical — highest tag volume, review first
  if (index === 0) {
    return {
      cardClass: "border-red-300/70 bg-red-50/60 dark:border-red-800/50 dark:bg-red-950/20",
      rankClass: "border-red-400/80 bg-red-100 text-red-700 dark:border-red-800/60 dark:bg-red-900/40 dark:text-red-300",
    }
  }

  // Warning
  if (index === 1) {
    return {
      cardClass: "border-orange-300/70 bg-orange-50/60 dark:border-orange-800/50 dark:bg-orange-950/20",
      rankClass: "border-orange-400/80 bg-orange-100 text-orange-700 dark:border-orange-800/60 dark:bg-orange-900/40 dark:text-orange-300",
    }
  }

  // Caution
  if (index === 2) {
    return {
      cardClass: "border-yellow-300/70 bg-yellow-50/60 dark:border-yellow-700/50 dark:bg-yellow-950/20",
      rankClass: "border-yellow-400/80 bg-yellow-100 text-yellow-700 dark:border-yellow-700/60 dark:bg-yellow-900/40 dark:text-yellow-300",
    }
  }

  return {
    cardClass: "border-border/70 bg-background/72",
    rankClass: "border-border/70 bg-card text-muted-foreground",
  }
}

function RegistryDensitySkeleton() {
  return (
    <div className="rounded-[20px] border border-border/70 bg-background/72 px-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-14 rounded-[16px]" />
          <Skeleton className="h-14 rounded-[16px]" />
        </div>
      </div>
    </div>
  )
}

function RepositoryRankSkeleton() {
  return (
    <div className="rounded-[18px] border border-border/70 bg-background/72 px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
