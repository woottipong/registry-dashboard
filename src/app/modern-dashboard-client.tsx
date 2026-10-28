"use client"

import Link from "next/link"
import {
  ArrowRightIcon,
  ClockIcon,
  DatabaseIcon,
  FolderIcon,
  PlusIcon,
  ShieldCheckIcon,
  TagIcon,
  TrendingUpIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useActivity } from "@/contexts/activity-context"
import { useMounted } from "@/hooks/use-mounted"
import { useI18n } from "@/contexts/i18n-context"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

/**
 * Refined Area Sparkline with smooth subtle gradient matching Apple Bento aesthetics
 */
function Sparkline({
  data,
  color = "#30D158",
  id = "sparkline",
  className = "",
}: {
  data: number[]
  color?: string
  id?: string
  className?: string
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const width = 92
  const height = 26
  const paddingY = 4
  const effectiveHeight = height - paddingY * 2

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - paddingY - ((val - min) / range) * effectiveHeight
    return { x, y }
  })

  // Generate smooth cubic bezier curve
  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
    const prev = arr[idx - 1]
    const cpX = (prev.x + pt.x) / 2
    return `${acc} C ${cpX.toFixed(1)} ${prev.y.toFixed(1)}, ${cpX.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
  }, "")

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`
  const gradId = `grad-${id}`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-6 w-22 shrink-0 overflow-visible ${className}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const { dashboardData, isLoadingRegistries, isLoadingRepos, registries } = useDashboardData({
    initialRegistries,
  })
  const { activities, isLoading: isLoadingActivity } = useActivity()
  const isMounted = useMounted()
  const { t } = useI18n()

  const { totalRepositories, totalTags, registriesWithStats, chartData } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size
  const defaultRegistry = registries.find((r) => r.isDefault) ?? registries[0] ?? null

  // Empty dashboard: Single stage CTA tile
  if (!isLoadingRegistries && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center py-10">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white p-10 text-center text-foreground shadow-[0_12px_44px_rgba(0,0,0,0.06)] border border-black/[0.04] dark:bento-stage-card dark:text-white dark:border-white/10 dark:shadow-2xl">
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
            {t("dashboard.addRegistry", "Connect your first registry")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground dark:text-neutral-400">
            {t("dashboard.subtitle", "Turn this workspace into a live container operations dashboard for Docker Hub and Registry V2.")}
          </p>

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-[#0077ED] text-white font-medium shadow-[0_2px_8px_rgba(0,113,227,0.25)]" asChild>
              <Link href="/registries/new">
                <PlusIcon data-icon="inline-start" className="mr-1 size-4" />
                {t("dashboard.addRegistry", "Add Registry")}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t("dashboard.title", "Overview")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t("dashboard.subtitle", "Container registries, repositories, and tag telemetry.")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-full shadow-xs" asChild>
            <Link href="/repos">
              <FolderIcon data-icon="inline-start" className="size-3.5" />
              {t("dashboard.browseRepos", "Repositories")}
            </Link>
          </Button>
          <Button size="sm" className="rounded-full shadow-xs" asChild>
            <Link href="/registries/new">
              <PlusIcon data-icon="inline-start" className="size-3.5" />
              {t("dashboard.addRegistry", "Add registry")}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (4 clean unified Apple Bento Tiles) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Registries (Clean White Bento Tile) */}
        <Link
          href="/registries"
          className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1C1C1E] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] border border-black/[0.04] dark:border-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <DatabaseIcon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.registries", "Registries")}</span>
            </div>
          </div>

          <div className="my-2.5">
            {isLoadingRegistries ? (
              <Skeleton className="h-9 w-16 rounded-xl" />
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                {registries.length}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-1 text-xs font-medium text-[#30D158]">
              <TrendingUpIcon className="size-3.5 shrink-0" />
              <span>{registries.length > 0 ? t("dashboard.live", "Live") : t("dashboard.standby", "Standby")}</span>
            </div>
            <Sparkline
              data={[1, 1.2, 1.3, 1.2, 1.5, 1.8, Math.max(registries.length, 2)]}
              color="#30D158"
              id="kpi-reg"
            />
          </div>
        </Link>

        {/* Card 2: Repositories (Apple White Bento Tile) */}
        <Link
          href="/repos"
          className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1C1C1E] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] border border-black/[0.04] dark:border-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FolderIcon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.repositories", "Repositories")}</span>
            </div>
          </div>

          <div className="my-2.5">
            {isLoadingRegistries || isLoadingRepos ? (
              <Skeleton className="h-9 w-20 rounded-xl" />
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                {totalRepositories.toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-1 text-xs font-medium text-[#30D158]">
              <TrendingUpIcon className="size-3.5 shrink-0" />
              <span>+{totalRepositories} {t("dashboard.indexed", "indexed")}</span>
            </div>
            <Sparkline
              data={[3, 4, 6, 7, 6, 9, Math.max(totalRepositories, 4)]}
              color="#30D158"
              id="kpi-repos"
            />
          </div>
        </Link>

        {/* Card 3: Tags & Versions (Apple White Bento Tile) */}
        <Link
          href="/repos"
          className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1C1C1E] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] border border-black/[0.04] dark:border-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <TagIcon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.tags", "Tags")}</span>
            </div>
          </div>

          <div className="my-2.5">
            {isLoadingRegistries || isLoadingRepos ? (
              <Skeleton className="h-9 w-20 rounded-xl" />
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                {totalTags.toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-1 text-xs font-medium text-[#30D158]">
              <TrendingUpIcon className="size-3.5 shrink-0" />
              <span>+{totalTags} {t("dashboard.tags", "active")}</span>
            </div>
            <Sparkline
              data={[5, 7, 8, 12, 11, 15, Math.max(totalTags, 6)]}
              color="#30D158"
              id="kpi-tags"
            />
          </div>
        </Link>

        {/* Card 4: Providers (Apple White Bento Tile) */}
        <Link
          href="/registries"
          className="group flex flex-col justify-between rounded-[24px] bg-white dark:bg-[#1C1C1E] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] border border-black/[0.04] dark:border-white/[0.08] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheckIcon className="size-3.5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.providers", "Providers")}</span>
            </div>
          </div>

          <div className="my-2.5">
            {isLoadingRegistries ? (
              <Skeleton className="h-9 w-16 rounded-xl" />
            ) : (
              <div className="font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-foreground tabular-nums">
                {providerCount}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="inline-flex items-center gap-1 text-xs font-medium text-[#30D158]">
              <TrendingUpIcon className="size-3.5 shrink-0" />
              <span>{t("dashboard.operational", "100% operational")}</span>
            </div>
            <Sparkline
              data={[1, 1.2, 1.1, 1.4, 1.6, 1.8, Math.max(providerCount, 2)]}
              color="#30D158"
              id="kpi-prov"
            />
          </div>
        </Link>
      </div>

      {/* Bento Grid: 2-Column Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Registry Inventory Tile */}
        <div className="flex flex-col justify-between rounded-[28px] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">{t("dashboard.inventoryTitle", "Registry inventory")}</h2>
                <p className="text-xs text-muted-foreground">{t("dashboard.inventorySubtitle", "Repository volume by connected endpoint")}</p>
              </div>
              <Link
                href="/registries"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {t("dashboard.manage", "Manage")}
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            {/* Distribution share meter (only if > 1 registry) */}
            {registriesWithStats.length > 1 && totalRepositories > 0 && (
              <div className="mb-4 space-y-1.5 rounded-2xl bg-secondary/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">{t("dashboard.repoShare", "Repository share")}</span>
                  <span className="font-mono text-[11px]">{totalRepositories} {t("dashboard.total", "total")}</span>
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
                  <Skeleton key={i} className="h-14 w-full rounded-2xl" />
                ))
              ) : (
                registriesWithStats.map((registry) => {
                  return (
                    <Link
                      key={registry.id}
                      href={`/repos?registry=${registry.id}`}
                      className="group flex items-center justify-between rounded-2xl bg-secondary/25 p-3.5 transition-all hover:bg-secondary/60 hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground/70 group-hover:text-primary transition-colors">
                          <DatabaseIcon className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                              {registry.name}
                            </p>
                            {registry.isDefault && (
                              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">
                                Default
                              </span>
                            )}
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {registry.provider === "dockerhub" ? "Docker Hub" : "Registry V2"}
                            </span>
                          </div>
                          <p className="truncate font-mono text-xs text-muted-foreground mt-0.5">
                            {registry.url}
                          </p>
                        </div>
                      </div>

                      <div className="ml-4 shrink-0 text-right">
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {registry.repoCount} <span className="font-normal text-muted-foreground text-[11px]">repos</span>
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {registry.tagCount} tags
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {defaultRegistry && (
            <p className="mt-4 text-[11px] text-muted-foreground">
              Default registry: <span className="font-medium text-foreground">{defaultRegistry.name}</span>
            </p>
          )}
        </div>

        {/* Top Repositories Tile */}
        <div className="flex flex-col justify-between rounded-[28px] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.08]">
          <div>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">{t("dashboard.topReposTitle", "Top repositories")}</h2>
                <p className="text-xs text-muted-foreground">{t("dashboard.topReposSubtitle", "Highest tag volume across connected registries")}</p>
              </div>
              <Link
                href="/repos"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {t("dashboard.viewAll", "View all")}
                <ArrowRightIcon className="size-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {isLoadingRegistries || isLoadingRepos ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-2xl" />
                ))
              ) : chartData.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No repository ranking data available yet.
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
                      className="group flex items-center justify-between rounded-2xl bg-secondary/25 p-3 transition-all hover:bg-secondary/60 hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${rankStyle}`}>
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                            {repo.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {registry?.name ?? repo.registryId}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-mono text-xs font-medium text-foreground">
                          <TagIcon className="size-3 text-muted-foreground" />
                          {repo.tagCount}
                        </span>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            Ranked by total tag manifests indexed
          </p>
        </div>
      </div>

      {/* Recent Activity Feed (Full-width Bento card) */}
      <div className="flex flex-col rounded-[28px] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-black/[0.04] dark:border-white/[0.08]">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold tracking-tight text-foreground">{t("dashboard.recentActivityTitle", "Recent activity")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">{t("dashboard.liveOperations", "Live operations stream")}</span>
        </div>

        <div className="space-y-2">
          {!isMounted || isLoadingActivity ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : activities.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {t("dashboard.noActivity", "No recent activity recorded yet. Activity will appear here when images or registries are accessed.")}
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
                  className="flex items-center justify-between rounded-xl bg-secondary/25 px-3.5 py-2.5 text-xs transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeBadgeStyle}`}>
                      {item.type}
                    </span>
                    <span className="truncate font-mono text-xs text-foreground font-medium">
                      {item.repository}
                    </span>
                    {item.tag && (
                      <span className="font-mono text-xs text-muted-foreground">:{item.tag}</span>
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
