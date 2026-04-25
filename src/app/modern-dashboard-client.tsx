"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRightIcon,
  BadgePlusIcon,
  DatabaseIcon,
  FolderIcon,
  TagIcon,
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
        <div className="flex flex-col gap-4 border-b border-border/70 pb-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="max-w-2xl text-sm leading-5 text-muted-foreground">
              Connect a registry to start tracking repositories and tag volume.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
          className="rounded-lg border-border/70 bg-card/80 p-14"
        />
      </section>
    )
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Monitor connected registries, repository counts, and tag volume.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/registries/new">
                <BadgePlusIcon data-icon="inline-start" />
                Add Registry
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/repos">
                Browse repositories
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <CompactMetric
            label="Registries"
            value={isLoadingRegistries ? null : String(registries.length)}
            note={`${providerCount} providers`}
            icon={<DatabaseIcon className="size-4 text-muted-foreground" />}
          />
          <CompactMetric
            label="Repositories"
            value={isLoadingRegistries || isLoadingRepos ? null : String(totalRepositories)}
            note="Loaded from connected registries"
            icon={<FolderIcon className="size-4 text-muted-foreground" />}
          />
          <CompactMetric
            label="Tags"
            value={isLoadingRegistries || isLoadingRepos ? null : String(totalTags)}
            note="Known tag count"
            icon={<TagIcon className="size-4 text-muted-foreground" />}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DashboardPanel
          title="Registry Inventory"
          description="Repository and tag totals by registry."
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
                    className="group block rounded-lg border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:bg-background"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold tracking-tight">{registry.name}</p>
                            {registry.isDefault ? (
                              <Badge className="h-5 border-primary/10 bg-primary/10 px-2 text-[11px] text-primary shadow-none hover:bg-primary/10">
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
                          label="Repos"
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
          title="Top Repositories"
          description="Highest known tag counts across connected registries."
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
                    className="group block rounded-lg border border-border/70 bg-background/70 px-4 py-3 transition-colors hover:bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${rankTone}`}>
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
    <div className="rounded-lg border border-border/70 bg-card/80">
      <div className="border-b border-border/70 px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
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
    <div className="rounded-lg border border-border/70 bg-card/80 px-3.5 py-3">
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
        <p className="truncate text-xs text-muted-foreground">{note}</p>
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
    <div className="space-y-2 rounded-md border border-border/70 bg-card/70 px-3 py-3">
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
    <span className="inline-flex h-6 items-center rounded-md border border-border/70 bg-background px-2 text-[11px] font-medium text-foreground/72">
      {label}
    </span>
  )
}

function getRankTone(index: number) {
  if (index === 0) {
    return "border-primary/30 bg-primary/10 text-primary"
  }

  if (index === 1) {
    return "border-foreground/15 bg-foreground/5 text-foreground/80"
  }

  if (index === 2) {
    return "border-foreground/15 bg-foreground/5 text-foreground/80"
  }

  return "border-border/70 bg-card text-muted-foreground"
}

function RegistryDensitySkeleton() {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
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
          <Skeleton className="h-14 rounded-md" />
          <Skeleton className="h-14 rounded-md" />
        </div>
      </div>
    </div>
  )
}

function RepositoryRankSkeleton() {
  return (
    <div className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </div>
    </div>
  )
}
