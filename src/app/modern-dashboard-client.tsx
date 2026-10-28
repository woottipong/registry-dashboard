"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  ClockIcon,
  DatabaseIcon,
  FolderIcon,
  PlusIcon,
  ShieldCheckIcon,
  TagIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useActivity } from "@/contexts/activity-context"
import { useMounted } from "@/hooks/use-mounted"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries, isRegistryError, failedRegistryIds, hasIncompleteData, hasUnknownTagCounts, retry } = useDashboardData({
    initialRegistries,
  })
  const { activities, isLoading: isLoadingActivity } = useActivity()
  const isMounted = useMounted()

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size
  const defaultRegistry = registries.find((r) => r.isDefault) ?? registries[0] ?? null

  // Empty dashboard: Single stage CTA tile
  if (!isLoadingRegistries && !isRegistryError && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center py-10">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-panel bg-white p-10 text-center text-foreground shadow-[0_12px_44px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:bento-stage-card dark:text-white dark:border-white/10 dark:shadow-2xl">
          {/* Light Mode: Apple 3D blue squircle render */}
          <div className="relative mx-auto my-6 flex size-24 items-center justify-center rounded-[24px] bg-gradient-to-b from-[#E8F1FF] to-[#D5E5FF] shadow-[0_8px_24px_rgba(0,113,227,0.18)] ring-1 ring-primary/20 dark:hidden">
            <DatabaseIcon className="size-10 text-primary" />
          </div>
          {/* Dark Mode: Studio glossy sphere render */}
          <div className="relative mx-auto my-6 hidden size-28 items-center justify-center dark:flex">
            <div className="absolute -bottom-4 h-6 w-24 rounded-full bg-black/80 blur-md" />
            <div
              className="relative size-24 rounded-full shadow-[inset_0_-8px_16px_rgba(0,0,0,0.8),inset_0_4px_12px_rgba(255,255,255,0.4)]"
              style={{
                background: "radial-gradient(circle at 35% 30%, #52525b 0%, #27272a 40%, #09090b 85%)",
              }}
            >
              <div className="absolute left-4 top-3 h-5 w-8 rounded-full bg-white/35 blur-[2px]" />
              <div className="absolute inset-0 rounded-full border border-white/20" />
              <DatabaseIcon className="absolute inset-0 m-auto size-8 text-white/80" />
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl text-foreground dark:text-white">
            {"Add registry"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground dark:text-neutral-400">
            {"Container registries, repositories, and tag telemetry."}
          </p>

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="rounded-control px-8 bg-primary hover:bg-[#0077ED] text-white font-medium shadow-[0_2px_8px_rgba(0,113,227,0.25)]" asChild>
              <Link href="/registries/new">
                <PlusIcon data-icon="inline-start" className="mr-1 size-4" />
                {"Add registry"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl xl:max-w-[1340px] flex-col gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between pb-0.5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {"Overview"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {"Container registries, repositories, and tag telemetry."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-control shadow-xs text-xs h-9 px-3 border-link text-link hover:text-primary-foreground" asChild>
            <Link href="/repos">
              <FolderIcon data-icon="inline-start" className="size-3.5" />
              {"Browse repositories"}
            </Link>
          </Button>
          <Button size="sm" className="rounded-control shadow-xs text-xs h-9 px-3" asChild>
            <Link href="/registries/new">
              <PlusIcon data-icon="inline-start" className="size-3.5" />
              {"Add registry"}
            </Link>
          </Button>
        </div>
      </div>

      {(isRegistryError || failedRegistryIds.length > 0) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-panel border border-destructive/30 bg-card px-4 py-3 text-sm">
          <p>{"Some registry data could not be loaded. Counts may be incomplete."}</p>
          <Button variant="outline" size="sm" className="rounded-control border-link text-link hover:text-primary-foreground" onClick={retry}>
            {"Try again"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Registries", value: isRegistryError && registries.length === 0 ? null : registries.length, href: "/registries", icon: DatabaseIcon, loading: isLoadingRegistries },
          { label: "Repositories", value: isRegistryError || (registries.length > 0 && failedRegistryIds.length === registries.length) ? null : totalRepositories, href: "/repos", icon: FolderIcon, loading: isLoadingRegistries || isLoadingRepos },
          { label: "Tags", value: isRegistryError || failedRegistryIds.length > 0 || hasUnknownTagCounts ? null : totalTags, href: "/repos", icon: TagIcon, loading: isLoadingRegistries || isLoadingRepos },
          { label: "Providers", value: isRegistryError && registries.length === 0 ? null : providerCount, href: "/registries", icon: ShieldCheckIcon, loading: isLoadingRegistries },
        ].map(({ label, value, href, icon: Icon, loading }) => (
          <Link key={label} href={href} className="group rounded-panel border border-panel-border bg-card p-4 transition-colors hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:border-white/25">
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span className="flex min-w-0 items-center gap-2 text-xs font-medium"><Icon className="size-4 shrink-0" /><span className="truncate">{label}</span></span>
              <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
            </div>
            {loading ? <Skeleton className="mt-3 h-7 w-16 rounded-md" /> : (
              <div className="mt-3 text-2xl font-semibold tabular-nums">{value === null ? "—" : value.toLocaleString()}</div>
            )}
          </Link>
        ))}
      </div>
      {(hasIncompleteData || hasUnknownTagCounts) && !isLoadingRepos && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {hasIncompleteData && "Counts and rankings include only loaded repositories."}
          {hasIncompleteData && hasUnknownTagCounts && " "}
          {hasUnknownTagCounts && "Some providers do not supply tag counts."}
        </p>
      )}

      {/* Bento Grid: 2-Column Section */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-2">
        {/* Registry Inventory Tile */}
        <div className="flex flex-col justify-between rounded-panel bg-card p-5 sm:p-6 shadow-panel border border-panel-border">
          <div>
            <div className="flex items-center justify-between pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{"Registry inventory"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{"Repository volume by connected endpoint"}</p>
              </div>
              <Link
                href="/registries"
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-link hover:underline"
              >
                {"Manage"}
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            {/* Distribution share meter (only if > 1 registry) */}
            {!isLoadingRepos && !hasIncompleteData && registriesWithStats.length > 1 && totalRepositories > 0 && (
              <div className="mb-4 space-y-1.5 rounded-control bg-secondary/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{"Repository share"}</span>
                  <span className="font-mono text-[11px]">{totalRepositories} {"total"}</span>
                </div>
                <div className="flex h-2 w-full gap-1 overflow-hidden rounded-full bg-secondary/50">
                  {registriesWithStats.map((reg, idx) => {
                    const share = (reg.repoCount / totalRepositories) * 100
                    if (share <= 0) return null
                    const colors = ["bg-[#0071E3]", "bg-[#30D158]", "bg-[#BF5AF2]", "bg-[#FF9F0A]", "bg-[#64D2FF]"]
                    const color = colors[idx % colors.length]
                    return (
                      <div
                        key={reg.id}
                        title={`${reg.name}: ${reg.repoCount} repos`}
                        style={{ width: `${Math.max(share, 3)}%` }}
                        className={`h-full rounded-full ${color}`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {isLoadingRegistries ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-panel" />
                ))
              ) : (
                registriesWithStats.map((registry) => {
                  return (
                    <Link
                      key={registry.id}
                      href={`/repos?registry=${registry.id}`}
                      className="group flex items-center justify-between rounded-control border-b border-border/60 px-1 py-3 transition-colors last:border-0 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-secondary text-foreground/70 group-hover:text-primary transition-colors">
                          <DatabaseIcon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="truncate text-xs sm:text-sm font-semibold tracking-tight text-foreground">
                              {registry.name}
                            </p>
                            {registry.isDefault && (
                              <span className="rounded bg-foreground/10 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                                {"Default"}
                              </span>
                            )}
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                              {registry.provider === "dockerhub" ? "Docker Hub" : "Registry V2"}
                            </span>
                          </div>
                          <p className="truncate font-mono text-[11px] text-muted-foreground mt-0.5">
                            {registry.url}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0 text-right">
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {isLoadingRepos || failedRegistryIds.includes(registry.id) ? "—" : registry.repoCount} <span className="font-normal text-muted-foreground text-xs">repos</span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {isLoadingRepos || failedRegistryIds.includes(registry.id) || registry.tagCount === null ? "—" : registry.tagCount} tags
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {defaultRegistry && (
            <p className="mt-3 text-xs text-muted-foreground">
              {"Default registry"}: <span className="font-medium text-foreground">{defaultRegistry.name}</span>
            </p>
          )}
        </div>

        {/* Top Repositories Tile */}
        <div className="flex flex-col justify-between lg:row-span-2 rounded-panel bg-card p-5 sm:p-6 shadow-panel border border-panel-border">
          <div>
            <div className="flex items-center justify-between pb-3.5">
              <div>
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{"Top repositories"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{"Highest tag volume across connected registries"}</p>
              </div>
              <Link
                href="/repos"
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-link hover:underline"
              >
                {"View all"}
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {isLoadingRegistries || isLoadingRepos ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-panel" />
                ))
              ) : chartData.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  {"No repository ranking data available yet."}
                </p>
              ) : (
                chartData.slice(0, 5).map((repo, index) => {
                  const registry = registriesWithStats.find((item) => item.id === repo.registryId)
                  const rankColors = [
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
                    "bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/20",
                    "bg-amber-700/10 text-amber-700 dark:text-amber-500 ring-1 ring-amber-700/20",
                  ]
                  const rankStyle = rankColors[index] || "bg-secondary text-muted-foreground"

                  return (
                    <Link
                      key={`${repo.registryId}-${repo.name}`}
                      href={`/repos/${repo.registryId}/${repo.name}`}
                      className="group flex items-center justify-between rounded-control border-b border-border/60 px-1 py-3 transition-colors last:border-0 hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${rankStyle}`}>
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs sm:text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {repo.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {registry?.name ?? repo.registryId}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                          <TagIcon className="size-2.5 text-muted-foreground" />
                          {repo.tagCount}
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {"Ranked by available tag counts in loaded repositories."}
          </p>
        </div>

        {/* Recent Activity Feed */}
        <div className="flex flex-col rounded-panel bg-card p-5 sm:p-6 shadow-panel border border-panel-border">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-3.5 text-muted-foreground" />
              <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{"Recent activity"}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{"Recent recorded operations"}</span>
          </div>

          <div className="space-y-1.5">
            {!isMounted || isLoadingActivity ? (
              <div className="space-y-1.5">
                <Skeleton className="h-9 w-full rounded-control" />
                <Skeleton className="h-9 w-full rounded-control" />
                <Skeleton className="h-9 w-full rounded-control" />
              </div>
            ) : activities.length === 0 ? (
              <p className="py-5 text-center text-xs text-muted-foreground">
                {"No recent activity recorded yet. Activity will appear here when images or registries are accessed."}
              </p>
            ) : (
              activities.slice(0, 6).map((item) => {
                const typeBadgeStyle = {
                  pull: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                  push: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  delete: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  inspect: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                }[item.type as "pull" | "push" | "delete" | "inspect"] || "bg-secondary text-foreground"

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b border-border/60 px-1 py-2.5 text-xs last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-semibold uppercase ${typeBadgeStyle}`}>
                        {item.type}
                      </span>
                      <span className="truncate font-mono text-xs text-foreground font-medium">
                        {item.repository}
                      </span>
                      {item.tag && (
                        <span className="font-mono text-xs text-muted-foreground">:{item.tag}</span>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
