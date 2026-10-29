"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DatabaseIcon,
  FolderIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  TagIcon,
  UploadIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useMounted } from "@/hooks/use-mounted"
import { useActivity } from "@/contexts/activity-context"
import { formatDate, formatEstimatedSize, generatePullCommand, registryHostFromUrl } from "@/lib/format"
import { copyToClipboard } from "@/lib/clipboard"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const router = useRouter()
  const isMounted = useMounted()
  const {
    dashboardData,
    isLoadingRegistries,
    isLoadingRepos,
    registries,
    isRegistryError,
    failedRegistryIds,
    retry,
  } = useDashboardData({ initialRegistries })

  const { activities } = useActivity()

  const { totalRepositories, totalTags, registriesWithStats, repositories } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size

  // Active filter tab: "all" or specific registry ID
  const [activeTab, setActiveTab] = useState<string>("all")
  // Search text within table
  const [tableSearch, setTableSearch] = useState<string>("")
  // Track which item's pull command was just copied (ID or repo name)
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null)

  interface RecentPushedImage {
    id: string
    repository: string
    tag: string
    registryName: string
    user?: string
    timestamp: string
    pullCommand: string
    href: string
  }

  // 5 Most recent pushed images across telemetry and catalog
  const recentPushedImages = useMemo<RecentPushedImage[]>(() => {
    const items: RecentPushedImage[] = []
    const seen = new Set<string>()

    // 1. Process push events from activity telemetry
    const pushActivities = activities.filter((a) => a.type === "push")
    for (const act of pushActivities) {
      const tag = act.tag || "latest"
      const key = `${act.repository}:${tag}`
      if (seen.has(key)) continue
      seen.add(key)

      const reg =
        registries.find(
          (r) => r.name === act.registry || r.id === act.registry,
        ) ?? registries[0]

      const regHost = reg ? registryHostFromUrl(reg.url) : undefined
      const pullCmd = generatePullCommand({
        registry: regHost,
        repository: act.repository,
        tag,
      })

      items.push({
        id: act.id,
        repository: act.repository,
        tag,
        registryName: reg?.name ?? act.registry,
        user: act.user,
        timestamp: act.timestamp,
        pullCommand: pullCmd,
        href: reg?.id
          ? `/repos/${reg.id}/${act.repository}?tag=${encodeURIComponent(tag)}`
          : "/repos",
      })

      if (items.length >= 5) break
    }

    // 2. If fewer than 5, backfill from catalog repositories so list is rich and not empty
    if (items.length < 5) {
      for (const repo of repositories) {
        const tag = "latest"
        const key = `${repo.fullName}:${tag}`
        if (seen.has(key)) continue
        seen.add(key)

        const reg = registries.find((r) => r.id === repo.registryId)
        const regHost = reg ? registryHostFromUrl(reg.url) : undefined
        const pullCmd = generatePullCommand({
          registry: regHost,
          repository: repo.fullName,
          tag,
        })

        const timestamp = repo.lastUpdated ?? ""

        items.push({
          id: `repo-${repo.registryId}-${repo.fullName}`,
          repository: repo.fullName,
          tag,
          registryName: repo.registryName,
          user: undefined,
          timestamp,
          pullCommand: pullCmd,
          href: `/repos/${repo.registryId}/${repo.fullName}?tag=${encodeURIComponent(tag)}`,
        })

        if (items.length >= 5) break
      }
    }

    return items
  }, [activities, registries, repositories])

  // Top 10 repositories sorted by tagCount desc (filtered by tab and search)
  const topRepositories = useMemo(() => {
    const matched = repositories.filter((repo) => {
      const matchesTab = activeTab === "all" || repo.registryId === activeTab
      const matchesSearch =
        !tableSearch ||
        repo.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (repo.namespace && repo.namespace.toLowerCase().includes(tableSearch.toLowerCase()))
      return matchesTab && matchesSearch
    })

    return [...matched]
      .sort((a, b) => {
        const tagDiff = (b.tagCount ?? 0) - (a.tagCount ?? 0)
        if (tagDiff !== 0) return tagDiff
        return a.fullName.localeCompare(b.fullName)
      })
      .slice(0, 10)
  }, [repositories, activeTab, tableSearch])

  // Highest tag count in current top 10 for relative bar calculation
  const maxTopTagCount = useMemo(() => {
    return Math.max(...topRepositories.map((r) => r.tagCount ?? 0), 1)
  }, [topRepositories])

  // Safe format helpers for timestamps
  const safeFormatDate = (dateInput?: string | null): string => {
    if (!dateInput) return "Indexed in catalog"
    try {
      return formatDate(dateInput)
    } catch {
      return "Indexed in catalog"
    }
  }

  const formatRelativeTime = (dateInput?: string | null): string => {
    if (!dateInput) return "catalog"
    try {
      const formatted = formatDate(dateInput).split(" (")[0] || ""
      return formatted
        .replace(" seconds ago", "s ago")
        .replace(" second ago", "s ago")
        .replace(" minutes ago", "m ago")
        .replace(" minute ago", "m ago")
        .replace(" hours ago", "h ago")
        .replace(" hour ago", "h ago")
        .replace(" days ago", "d ago")
        .replace(" day ago", "d ago")
        .replace(" months ago", "mo ago")
        .replace(" month ago", "mo ago") || formatted
    } catch {
      return "catalog"
    }
  }

  const handleCopyCommand = (cmd: string, id: string) => {
    if (!cmd) return
    void copyToClipboard(cmd, "Pull command copied to clipboard")
    setCopiedCommandId(id)
    setTimeout(() => {
      setCopiedCommandId((curr) => (curr === id ? null : curr))
    }, 2000)
  }

  // Empty dashboard: Single stage CTA tile
  if (!isLoadingRegistries && !isRegistryError && registries.length === 0) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col items-center justify-center py-12">
        <div className="w-full max-w-2xl rounded-panel bg-card p-8 sm:p-12 text-center shadow-panel border border-panel-border">
          <div className="mx-auto flex size-14 items-center justify-center rounded-control bg-primary/10 text-primary mb-5">
            <DatabaseIcon className="size-7" aria-hidden />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            {"Connect container registry"}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {"Add a Docker Registry V2 or Docker Hub endpoint to index repositories, image manifests, and layer telemetry."}
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" className="rounded-control px-6 font-medium" asChild>
              <Link href="/registries/new">
                <PlusIcon className="mr-1.5 size-4" />
                {"Add registry"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl pb-12 pt-2">
      {/* Page Header (Doorlog style: Title, Subtitle, and Top Right Action Buttons) */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {"Repository overview"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {"Real-time container catalog and tag telemetry across connected registry endpoints."}
          </p>
        </div>

        <Button size="sm" className="h-9 rounded-control gap-1.5 px-4 font-medium self-start sm:self-auto" asChild>
          <Link href="/registries/new">
            <PlusIcon className="size-3.5" />
            <span>{"Add registry"}</span>
          </Link>
        </Button>
      </header>

      {/* Error / Incomplete Data Banner */}
      {(isRegistryError || failedRegistryIds.length > 0) && (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-control border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-foreground"
        >
          <p>Some registry endpoints could not be reached. Telemetry may be partial.</p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={retry}>
            Try again
          </Button>
        </div>
      )}

      {/* Top 4-card KPI Stat Strip (Doorlog style: Large numbers, clean text) */}
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
                {registries.length}
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

        {/* Card 3: Tags */}
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

      {/* Main Two-Column Layout (Doorlog Asymmetric Split: ~70% Left, ~30% Right) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* LEFT COLUMN: Top 10 Repositories by Tag Volume (~70% width) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden flex flex-col justify-between h-full">
            {/* Table Header Toolbar */}
            <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Tabs (Doorlog style: All, Registry 1, Registry 2) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                    activeTab === "all"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>All</span>
                  <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                    {repositories.length}
                  </span>
                </button>

                {registriesWithStats.map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setActiveTab(reg.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                      activeTab === reg.id
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <span className="truncate max-w-[120px]">{reg.name}</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[10px] font-mono">
                      {reg.repoCount}
                    </span>
                  </button>
                ))}
              </div>

              {/* Inline Quick Search & Ranking Pill */}
              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex items-center gap-1 rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                  {"Top 10 by tags"}
                </span>
                <div className="relative w-full sm:w-48">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter repos…"
                    aria-label="Filter repositories"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-secondary/20 text-muted-foreground">
                    <th className="w-9 py-2.5 pl-3.5 pr-1 font-mono text-center text-[10px]">#</th>
                    <th className="py-2.5 px-3 font-medium">Repository</th>
                    <th className="py-2.5 px-3 font-medium hidden md:table-cell">Registry</th>
                    <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Namespace</th>
                    <th className="py-2.5 px-3 font-medium min-w-[120px]">Tags & Volume</th>
                    <th className="py-2.5 px-3 font-medium text-right hidden sm:table-cell">Est. Size</th>
                    <th className="w-10 py-2.5 pl-2 pr-4 text-right font-medium" aria-label="Inspect" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-sans">
                  {isLoadingRegistries || isLoadingRepos ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="h-12">
                        <td colSpan={7} className="px-4 py-3">
                          <Skeleton className="h-5 w-full rounded-control" />
                        </td>
                      </tr>
                    ))
                  ) : topRepositories.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                        No repositories found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    topRepositories.map((repo, idx) => {
                      const rowKey = `${repo.registryId}-${repo.fullName}`
                      const isTopRanked = idx === 0

                      return (
                        <tr
                          key={rowKey}
                          tabIndex={0}
                          role="row"
                          onClick={() => router.push(`/repos/${repo.registryId}/${repo.fullName}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              router.push(`/repos/${repo.registryId}/${repo.fullName}`)
                            }
                          }}
                          className="group cursor-pointer hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 text-foreground/90 transition-colors duration-100"
                        >
                          {/* Rank # */}
                          <td className="w-9 py-2.5 pl-3.5 pr-1 text-center font-mono">
                            {isTopRanked ? (
                              <span className="inline-flex size-5 items-center justify-center rounded-control bg-primary/20 text-primary border border-primary/30 text-[10px] font-bold font-mono">
                                1
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-muted-foreground/70">
                                {idx + 1}
                              </span>
                            )}
                          </td>

                          {/* Repository Name & Path */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <FolderIcon
                                className="size-3.5 shrink-0 transition-colors text-muted-foreground group-hover:text-primary"
                              />
                              <div className="flex flex-col min-w-0">
                                <Link
                                  href={`/repos/${repo.registryId}/${repo.fullName}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[160px] sm:max-w-[200px] hover:underline focus-visible:outline-none focus-visible:underline"
                                >
                                  {repo.name}
                                </Link>
                                {repo.namespace && repo.namespace !== "_root" && (
                                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                                    {repo.namespace}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Registry Endpoint */}
                          <td className="py-2.5 px-3 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 rounded-control bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {repo.provider === "dockerhub" ? (
                                <ServerIcon className="size-2.5 text-primary shrink-0" />
                              ) : (
                                <DatabaseIcon className="size-2.5 text-muted-foreground shrink-0" />
                              )}
                              <span className="truncate max-w-[100px]">{repo.registryName}</span>
                            </span>
                          </td>

                          {/* Namespace */}
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <span className="rounded-control bg-secondary/60 border border-border/50 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                              {repo.namespace || "_root"}
                            </span>
                          </td>

                          {/* Tags & Volume Bar */}
                          <td className="py-2.5 px-3">
                            <div className="flex flex-col gap-1 min-w-[110px]">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-semibold text-foreground">
                                  {repo.tagCount !== undefined ? `${repo.tagCount} tags` : "—"}
                                </span>
                                {totalTags > 0 && repo.tagCount ? (
                                  <span className="text-[10px] text-muted-foreground">
                                    {Math.round((repo.tagCount / totalTags) * 100)}%
                                  </span>
                                ) : null}
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/80 transition-all duration-300"
                                  style={{
                                    width: `${Math.max(
                                      Math.round(((repo.tagCount ?? 0) / maxTopTagCount) * 100),
                                      8,
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Est. Image Size */}
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-foreground whitespace-nowrap hidden sm:table-cell" title="Estimated total image disk footprint">
                            {formatEstimatedSize(repo.tagCount, repo.sizeBytes)}
                          </td>

                          {/* Action Link (Inspect) */}
                          <td className="w-10 py-2.5 pl-2 pr-4 text-right">
                            <Link
                              href={`/repos/${repo.registryId}/${repo.fullName}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 hover:bg-secondary transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              title={`Inspect ${repo.name} repository`}
                              aria-label={`Inspect ${repo.name} repository`}
                            >
                              <ArrowRightIcon className="size-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Banner */}
            <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground mt-auto">
              <span className="truncate text-[11px]">
                {"Top 10 repositories ranked by tag volume. Click any row to inspect tags and manifests."}
              </span>

              <Button variant="ghost" size="sm" className="h-6 text-[11px] font-mono px-2 hover:text-primary transition-colors cursor-pointer" asChild>
                <Link href="/repos">
                  <span>{`View all ${repositories.length} repos`}</span>
                  <ArrowRightIcon className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Inspector & Distribution Widgets (~30% width) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card 1: Registry Distribution (Doorlog style: "Crews this week" progress bars) */}
          <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel shrink-0">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <ServerIcon className="size-3.5 text-primary" />
                <h2 className="text-xs font-semibold text-foreground">
                  {"Registry distribution"}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                {"by repositories"}
              </span>
            </div>

            <div className="mt-3.5 flex flex-col gap-3">
              {isLoadingRegistries ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-full rounded-control" />
                ))
              ) : registriesWithStats.length === 0 ? (
                <p className="text-xs text-muted-foreground">No registries connected yet.</p>
              ) : (
                registriesWithStats.map((reg) => {
                  const sharePercentage =
                    totalRepositories > 0
                      ? Math.round((reg.repoCount / totalRepositories) * 100)
                      : 0

                  return (
                    <div key={reg.id} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[150px]">
                          {reg.name}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {`${reg.repoCount} of ${totalRepositories} · ${sharePercentage}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${Math.max(sharePercentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <p className="mt-3.5 pt-3 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed">
              {"All connected registry endpoints are operational with active credentials."}
            </p>
          </div>

          {/* Card 2: 5 Most Recent Pushed Images */}
          <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden flex flex-col justify-between flex-1">
            <div className="flex flex-col flex-1">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <UploadIcon className="size-3.5 text-primary" />
                  <h2 className="text-xs font-semibold text-foreground">
                    {"Recent pushed images"}
                  </h2>
                </div>
                {!isMounted ? (
                  <Skeleton className="h-5 w-16 rounded-control" />
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-control bg-secondary/80 border border-border/70 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {"5 latest"}
                  </span>
                )}
              </div>

              {/* Items List */}
              <div
                className={cn(
                  "divide-y divide-border/40 px-4 flex flex-col flex-1 py-1",
                  recentPushedImages.length >= 4 ? "justify-between" : "justify-start gap-1",
                )}
              >
                {!isMounted ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <div key={idx} className="py-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3.5 w-32 rounded-control" />
                        <Skeleton className="h-3 w-14 rounded-control" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24 rounded-control" />
                        <Skeleton className="h-3 w-10 rounded-control" />
                      </div>
                    </div>
                  ))
                ) : recentPushedImages.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex-1 flex items-center justify-center">
                    {"No pushed images recorded yet."}
                  </div>
                ) : (
                  recentPushedImages.map((item) => (
                    <div
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => router.push(item.href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          router.push(item.href)
                        }
                      }}
                      className="group flex flex-col gap-1 py-2 px-1.5 -mx-1.5 rounded-control transition-colors hover:bg-secondary/40 focus:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 cursor-pointer"
                    >
                      {/* Top line: Repo name + Tag badge + Time */}
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Link
                            href={item.href}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[190px] hover:underline focus-visible:outline-none focus-visible:underline"
                            title={item.repository}
                          >
                            {item.repository}
                          </Link>
                          <span className="inline-flex items-center gap-1 rounded-control bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 font-mono text-[10px] font-medium shrink-0">
                            <TagIcon className="size-2.5" />
                            <span className="truncate max-w-[80px]">{item.tag}</span>
                          </span>
                        </div>
                        <span
                          className="font-mono text-[10px] text-muted-foreground shrink-0"
                          suppressHydrationWarning
                          title={safeFormatDate(item.timestamp)}
                        >
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      {/* Bottom line: Endpoint & actor + Quick Actions */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                        <span className="truncate max-w-[170px]">
                          {item.registryName}
                          {item.user ? ` · ${item.user}` : ""}
                        </span>

                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyCommand(item.pullCommand, item.id)
                            }}
                            className="p-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                            title={`Copy: ${item.pullCommand}`}
                            aria-label={`Copy pull command for ${item.repository}`}
                          >
                            {copiedCommandId === item.id ? (
                              <CheckIcon className="size-3 text-success" />
                            ) : (
                              <CopyIcon className="size-3" />
                            )}
                          </button>
                          <Link
                            href={item.href}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-control text-muted-foreground group-hover:text-primary hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            title={`Inspect ${item.repository}:${item.tag}`}
                            aria-label={`Inspect ${item.repository}:${item.tag}`}
                          >
                            <ArrowRightIcon className="size-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer summary - aligned with Left Table footer banner */}
            <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground mt-auto">
              <span className="font-mono text-[11px]">{"Push telemetry feed"}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] font-mono px-2 hover:text-primary transition-colors cursor-pointer"
                asChild
              >
                <Link href="/repos">
                  <span>{"View all repos"}</span>
                  <ArrowRightIcon className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
