"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  FolderIcon,
  LayersIcon,
  PlusIcon,
  SearchIcon,
  ServerIcon,
  TagIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardData, type DashboardRepoItem } from "@/hooks/use-dashboard-data"
import { useCommandPalette } from "@/hooks/use-command-palette"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const {
    dashboardData,
    isLoadingRegistries,
    isLoadingRepos,
    registries,
    isRegistryError,
    failedRegistryIds,
    retry,
  } = useDashboardData({ initialRegistries })

  const { setOpen: setSearchOpen } = useCommandPalette()

  const { totalRepositories, totalTags, registriesWithStats, repositories } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size

  // Active filter tab: "all" or specific registry ID
  const [activeTab, setActiveTab] = useState<string>("all")
  // Search text within table
  const [tableSearch, setTableSearch] = useState<string>("")
  // Selected repository for the Right Inspector card
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null)
  // Copy pull command state
  const [copiedPull, setCopiedPull] = useState(false)

  // Filtered repositories based on tab and tableSearch
  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      const matchesTab = activeTab === "all" || repo.registryId === activeTab
      const matchesSearch =
        !tableSearch ||
        repo.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(tableSearch.toLowerCase()) ||
        (repo.namespace && repo.namespace.toLowerCase().includes(tableSearch.toLowerCase()))
      return matchesTab && matchesSearch
    })
  }, [repositories, activeTab, tableSearch])

  // Selected repo object (defaults to first item in filtered list if not explicitly selected)
  const activeSelectedRepo = useMemo(() => {
    if (selectedRepoId) {
      const found = repositories.find(
        (r) => `${r.registryId}-${r.fullName}` === selectedRepoId,
      )
      if (found) return found
    }
    return filteredRepositories[0] ?? null
  }, [selectedRepoId, repositories, filteredRepositories])

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

  const handleCopyPull = (repo: DashboardRepoItem) => {
    const registry = registries.find((r) => r.id === repo.registryId)
    let pullCmd = `docker pull ${repo.fullName}:latest`
    if (registry && registry.provider !== "dockerhub") {
      try {
        const parsedUrl = new URL(registry.url)
        pullCmd = `docker pull ${parsedUrl.host}/${repo.fullName}:latest`
      } catch {
        pullCmd = `docker pull ${repo.fullName}:latest`
      }
    }
    void navigator.clipboard.writeText(pullCmd)
    setCopiedPull(true)
    setTimeout(() => setCopiedPull(false), 2000)
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

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="h-9 rounded-control gap-2 text-xs font-medium border-border/80 hover:bg-secondary"
          >
            <SearchIcon className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block font-mono text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">⌘K</kbd>
          </Button>

          <Button size="sm" className="h-9 rounded-control gap-1.5 px-4 font-medium" asChild>
            <Link href="/registries/new">
              <PlusIcon className="size-3.5" />
              <span>{"Add registry"}</span>
            </Link>
          </Button>
        </div>
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
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* LEFT COLUMN: Dense Repository Inventory Table (~70% width) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden">
            {/* Table Header Toolbar */}
            <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Tabs (Doorlog style: All, Registry 1, Registry 2) */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors",
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
                      "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors",
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

              {/* Inline Quick Search Filter */}
              <div className="relative w-full sm:w-56">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter repositories…"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Table Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-secondary/20 text-muted-foreground">
                    <th className="py-2.5 pl-4 pr-3 font-medium">Repository</th>
                    <th className="py-2.5 px-3 font-medium">Registry</th>
                    <th className="py-2.5 px-3 font-medium">Tags</th>
                    <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Namespace</th>
                    <th className="py-2.5 pl-3 pr-4 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-sans">
                  {isLoadingRegistries || isLoadingRepos ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index} className="h-12">
                        <td colSpan={5} className="px-4 py-3">
                          <Skeleton className="h-5 w-full rounded-control" />
                        </td>
                      </tr>
                    ))
                  ) : filteredRepositories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-muted-foreground">
                        No repositories found matching this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRepositories.map((repo) => {
                      const rowKey = `${repo.registryId}-${repo.fullName}`
                      const isSelected = activeSelectedRepo?.fullName === repo.fullName && activeSelectedRepo?.registryId === repo.registryId

                      return (
                        <tr
                          key={rowKey}
                          onClick={() => setSelectedRepoId(rowKey)}
                          className={cn(
                            "group cursor-pointer transition-colors duration-100",
                            isSelected
                              ? "bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40"
                              : "hover:bg-secondary/40 text-foreground/90",
                          )}
                        >
                          {/* Repository Name */}
                          <td className="py-2.5 pl-4 pr-3">
                            <div className="flex items-center gap-2.5">
                              <FolderIcon
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                                )}
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[240px]">
                                  {repo.name}
                                </span>
                                {repo.namespace && repo.namespace !== "_root" && (
                                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                                    {repo.namespace}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Registry Endpoint */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 rounded-control bg-secondary/80 px-2 py-0.5 text-[11px] font-medium text-foreground">
                              {repo.provider === "dockerhub" ? (
                                <ServerIcon className="size-2.5 text-primary shrink-0" />
                              ) : (
                                <DatabaseIcon className="size-2.5 text-muted-foreground shrink-0" />
                              )}
                              <span className="truncate max-w-[110px]">{repo.registryName}</span>
                            </span>
                          </td>

                          {/* Tags Count */}
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 rounded-control bg-secondary/50 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                              <span className="size-1 rounded-full bg-success" />
                              {repo.tagCount !== undefined ? `${repo.tagCount} tags` : "—"}
                            </span>
                          </td>

                          {/* Namespace */}
                          <td className="py-2.5 px-3 hidden sm:table-cell">
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {repo.namespace ?? "_root"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 pl-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-control text-muted-foreground hover:text-foreground"
                                title="Copy docker pull command"
                                aria-label="Copy docker pull command"
                                onClick={() => handleCopyPull(repo)}
                              >
                                <CopyIcon className="size-3" />
                              </Button>

                              <Link
                                href={`/repos/${repo.registryId}/${repo.fullName}`}
                                className="inline-flex size-7 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                                title="Open in Tag Explorer"
                              >
                                <ArrowRightIcon className="size-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Banner (Doorlog style bottom bar) */}
            <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="truncate text-[11px]">
                {"Click any repository row to inspect its image manifest and pull commands."}
              </span>

              <Button variant="ghost" size="sm" className="h-6 text-[11px] font-mono px-2" asChild>
                <Link href="/repos">
                  <span>{`Total ${repositories.length}`}</span>
                  <ArrowRightIcon className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Inspector & Distribution Widgets (~30% width) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Registry Distribution (Doorlog style: "Crews this week" progress bars) */}
          <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel">
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

          {/* Card 2: Quick Inspector (Doorlog style: "Made safe, still open" item card) */}
          <div className="rounded-panel border border-panel-border bg-card p-4 shadow-panel flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <LayersIcon className="size-3.5 text-primary" />
                  <h2 className="text-xs font-semibold text-foreground">
                    {"Quick inspect"}
                  </h2>
                </div>
                {activeSelectedRepo && (
                  <span className="rounded-control bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-mono">
                    {"Selected"}
                  </span>
                )}
              </div>

              {activeSelectedRepo ? (
                <div className="mt-3.5 flex flex-col gap-3">
                  {/* Repo title & namespace */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {activeSelectedRepo.fullName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      {`${activeSelectedRepo.registryName} · ${activeSelectedRepo.provider === "dockerhub" ? "Docker Hub" : "V2 Registry"}`}
                    </p>
                  </div>

                  {/* Status pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded-control bg-success/10 text-success border border-success/20 px-2 py-0.5 text-[11px] font-medium">
                      <span className="size-1.5 rounded-full bg-success" />
                      {"Active catalog"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-control bg-secondary text-foreground px-2 py-0.5 text-[11px] font-mono">
                      {`${activeSelectedRepo.tagCount ?? 1} tags`}
                    </span>
                  </div>

                  {/* Pull command snippet */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {"Pull command"}
                    </span>
                    <div className="flex items-center justify-between rounded-control border border-border/70 bg-secondary/60 px-2.5 py-1.5">
                      <code className="text-[11px] font-mono text-foreground truncate max-w-[200px]">
                        {`docker pull ${activeSelectedRepo.fullName}:latest`}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopyPull(activeSelectedRepo)}
                        className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                        title="Copy command"
                      >
                        {copiedPull ? (
                          <CheckIcon className="size-3 text-success" />
                        ) : (
                          <CopyIcon className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Activity Timeline / Tag Info */}
                  <div className="pt-2 border-t border-border/50">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {"Telemetry"}
                    </span>
                    <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground font-mono text-[11px]">
                      <li className="flex items-center justify-between">
                        <span>Namespace:</span>
                        <span className="text-foreground">{activeSelectedRepo.namespace ?? "_root"}</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Default Tag:</span>
                        <span className="text-foreground">latest</span>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Target:</span>
                        <span className="text-foreground">linux/amd64</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Select a repository from the inventory to inspect.
                </div>
              )}
            </div>

            {activeSelectedRepo && (
              <div className="mt-4 pt-3 border-t border-border/60">
                <Button size="sm" className="w-full text-xs rounded-control h-8 font-medium gap-1.5" asChild>
                  <Link href={`/repos/${activeSelectedRepo.registryId}/${activeSelectedRepo.fullName}`}>
                    <span>{"Open full Tag Explorer"}</span>
                    <ExternalLinkIcon className="size-3" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
