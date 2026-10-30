"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DatabaseIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useMounted } from "@/hooks/use-mounted"
import { useActivity } from "@/contexts/activity-context"
import { generatePullCommand, registryHostFromUrl } from "@/lib/format"
import { copyToClipboard } from "@/lib/clipboard"
import { DashboardKpis } from "@/components/dashboard/dashboard-kpis"
import { DashboardRepoInventory } from "@/components/dashboard/dashboard-repo-inventory"
import { DashboardRegistryDistribution } from "@/components/dashboard/dashboard-registry-distribution"
import { DashboardRecentPushes, type RecentPushedItem } from "@/components/dashboard/dashboard-recent-pushes"
import type { RegistryConnection } from "@/types/registry"

interface ModernDashboardClientProps {
  initialRegistries?: RegistryConnection[]
}

export function ModernDashboardClient({ initialRegistries }: ModernDashboardClientProps) {
  const isMounted = useMounted()
  const {
    dashboardData,
    isLoadingRegistries,
    isLoadingRepos,
    registries,
    isRegistryError,
    failedRegistryIds,
    hasIncompleteData,
    hasUnknownTagCounts,
    retry,
  } = useDashboardData({ initialRegistries })

  const { activities } = useActivity()

  const { totalRepositories, totalTags, registriesWithStats, repositories } = dashboardData
  const providerCount = new Set(registriesWithStats.map((registry) => registry.provider)).size

  // Active filter tab: "all" or specific registry ID
  const [activeTab, setActiveTab] = useState<string>("all")
  // Search text within table
  const [tableSearch, setTableSearch] = useState<string>("")
  // Sort criteria for repository inventory
  const [sortBy, setSortBy] = useState<"name" | "tags">("tags")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  // Track which item's pull command was just copied (ID or repo name)
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null)

  const handleSortChange = (column: "name" | "tags") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(column)
      setSortOrder(column === "tags" ? "desc" : "asc")
    }
  }

  const failedRegistryNames = useMemo(() => {
    return failedRegistryIds.map(
      (id) => registries.find((r) => r.id === id)?.name ?? id,
    )
  }, [failedRegistryIds, registries])

  // Most recent pushed images from real push telemetry activities
  const recentPushedImages = useMemo<RecentPushedItem[]>(() => {
    const items: RecentPushedItem[] = []
    const seen = new Set<string>()

    // Process genuine push events from activity telemetry
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

    return items
  }, [activities, registries])

  // Top 10 repositories sorted by selected criteria (filtered by tab and search)
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
        if (sortBy === "name") {
          const cmp = a.fullName.localeCompare(b.fullName)
          return sortOrder === "asc" ? cmp : -cmp
        }
        const tagDiff = (b.tagCount ?? 0) - (a.tagCount ?? 0)
        if (tagDiff !== 0) return sortOrder === "asc" ? -tagDiff : tagDiff
        return a.fullName.localeCompare(b.fullName)
      })
      .slice(0, 10)
  }, [repositories, activeTab, tableSearch, sortBy, sortOrder])

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
    <section className="mx-auto w-full max-w-[1200px] pb-12 pt-2">
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
          <p>
            {failedRegistryNames.length > 0
              ? `Failed to reach endpoints: ${failedRegistryNames.join(", ")}. Telemetry may be partial.`
              : "Some registry endpoints could not be reached. Telemetry may be partial."}
          </p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={retry}>
            Try again
          </Button>
        </div>
      )}
      {hasIncompleteData && !isRegistryError && failedRegistryIds.length === 0 && (
        <p role="status" className="mt-5 rounded-control border border-warning/30 bg-warning/10 px-4 py-2.5 text-xs text-foreground">
          Some repositories are not included. Totals and rankings reflect the loaded results only.
        </p>
      )}

      {/* Top 4-card KPI Stat Strip */}
      <DashboardKpis
        registryCount={registries.length}
        totalRepositories={totalRepositories}
        totalTags={totalTags}
        providerCount={providerCount}
        isLoadingRegistries={isLoadingRegistries}
        isLoadingRepos={isLoadingRepos}
        hasIncompleteData={hasIncompleteData || isRegistryError}
        hasUnknownTagCounts={hasUnknownTagCounts}
      />

      {/* Main Two-Column Layout (Doorlog Asymmetric Split: ~70% Left, ~30% Right) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
        {/* LEFT COLUMN: Top 10 Repositories by Tag Volume (~70% width) */}
        <div className="lg:col-span-8 flex flex-col">
          <DashboardRepoInventory
            repositories={repositories}
            topRepositories={topRepositories}
            registriesWithStats={registriesWithStats}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tableSearch={tableSearch}
            onSearchChange={setTableSearch}
            isLoadingRegistries={isLoadingRegistries}
            isLoadingRepos={isLoadingRepos}
            totalTags={totalTags}
            hasIncompleteTagCounts={hasUnknownTagCounts || hasIncompleteData || isRegistryError}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>

        {/* RIGHT COLUMN: Inspector & Distribution Widgets (~30% width) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <DashboardRegistryDistribution
            registriesWithStats={registriesWithStats}
            totalRepositories={totalRepositories}
            isLoadingRegistries={isLoadingRegistries}
            failedRegistryNames={failedRegistryNames}
          />

          <DashboardRecentPushes
            recentPushedImages={recentPushedImages}
            isMounted={isMounted}
            copiedCommandId={copiedCommandId}
            onCopyCommand={handleCopyCommand}
          />
        </div>
      </div>
    </section>
  )
}
