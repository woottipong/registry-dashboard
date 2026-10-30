"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  ArrowUpDownIcon,
  DatabaseIcon,
  FolderIcon,
  SearchIcon,
  ServerIcon,
  XIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { DashboardRepoItem } from "@/hooks/use-dashboard-data"

export interface DashboardRepoInventoryProps {
  repositories: DashboardRepoItem[]
  topRepositories: DashboardRepoItem[]
  registriesWithStats: Array<{ id: string; name: string; repoCount: number }>
  activeTab: string
  onTabChange: (tab: string) => void
  tableSearch: string
  onSearchChange: (search: string) => void
  isLoadingRegistries: boolean
  isLoadingRepos: boolean
  totalTags: number
  sortBy?: "name" | "tags"
  sortOrder?: "asc" | "desc"
  onSortChange?: (column: "name" | "tags") => void
}

export function DashboardRepoInventory({
  repositories,
  topRepositories,
  registriesWithStats,
  activeTab,
  onTabChange,
  tableSearch,
  onSearchChange,
  isLoadingRegistries,
  isLoadingRepos,
  totalTags,
  sortBy = "tags",
  sortOrder = "desc",
  onSortChange,
}: DashboardRepoInventoryProps) {
  const router = useRouter()

  const maxTopTagCount = useMemo(() => {
    return Math.max(...topRepositories.map((r) => r.tagCount ?? 0), 1)
  }, [topRepositories])

  return (
    <div className="rounded-panel border border-panel-border bg-card shadow-panel overflow-hidden flex flex-col justify-between h-full">
      {/* Table Header Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs (Doorlog style: All, Registry 1, Registry 2) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0",
              activeTab === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <span>All</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs font-mono",
                activeTab === "all"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary text-muted-foreground border border-border/50",
              )}
            >
              {repositories.length}
            </span>
          </button>

          {registriesWithStats.map((reg) => (
            <button
              key={reg.id}
              type="button"
              onClick={() => onTabChange(reg.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0",
                activeTab === reg.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span className="truncate max-w-[120px]">{reg.name}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs font-mono",
                  activeTab === reg.id
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-secondary text-muted-foreground border border-border/50",
                )}
              >
                {reg.repoCount}
              </span>
            </button>
          ))}
        </div>

        {/* Inline Quick Search & Ranking Pill */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex items-center gap-1 rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
            {"Top 10 repositories"}
          </span>
          <div className="relative w-full sm:w-48">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Filter repos…"
              aria-label="Filter repositories"
              value={tableSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-control border border-border/70 bg-secondary/50 pl-7 pr-8 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {tableSearch.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Clear repository filter"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center rounded-control text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/70 bg-secondary/20 text-muted-foreground">
              <th className="w-9 py-2.5 pl-3.5 pr-1 font-mono text-center text-xs">#</th>
              <th className="py-2.5 px-3 font-medium">
                {onSortChange ? (
                  <button
                    type="button"
                    onClick={() => onSortChange("name")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Repository</span>
                    <ArrowUpDownIcon className={cn("size-3", sortBy === "name" ? "text-primary" : "opacity-40")} />
                  </button>
                ) : (
                  "Repository"
                )}
              </th>
              <th className="py-2.5 px-3 font-medium hidden md:table-cell">Registry</th>
              <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Namespace</th>
              <th className="py-2.5 px-3 font-medium min-w-[120px]">
                {onSortChange ? (
                  <button
                    type="button"
                    onClick={() => onSortChange("tags")}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Tags & Volume</span>
                    <ArrowUpDownIcon className={cn("size-3", sortBy === "tags" ? "text-primary" : "opacity-40")} />
                  </button>
                ) : (
                  "Tags & Volume"
                )}
              </th>
              <th className="w-10 py-2.5 pl-2 pr-4 text-right font-medium" aria-label="Inspect" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-sans">
            {isLoadingRegistries || isLoadingRepos ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="h-12">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 w-full rounded-control" />
                  </td>
                </tr>
              ))
            ) : topRepositories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-muted-foreground">
                  <p>No repositories found matching this filter.</p>
                  {tableSearch ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange("")}
                      className="mt-2 inline-flex items-center text-xs text-primary hover:underline cursor-pointer font-medium"
                    >
                      Clear search filter
                    </button>
                  ) : null}
                </td>
              </tr>
            ) : (
              topRepositories.map((repo, idx) => {
                const rowKey = `${repo.registryId}-${repo.fullName}`
                const isTopRanked = idx === 0 && sortBy === "tags" && sortOrder === "desc"

                return (
                  <tr
                    key={rowKey}
                    onClick={() => router.push(`/repos/${repo.registryId}/${repo.fullName}`)}
                    className="group cursor-pointer hover:bg-secondary/40 text-foreground/90 transition-colors duration-100"
                  >
                    {/* Rank # */}
                    <td className="w-9 py-2.5 pl-3.5 pr-1 text-center font-mono">
                      {isTopRanked ? (
                        <span className="inline-flex size-5 items-center justify-center rounded-control bg-primary text-primary-foreground text-xs font-bold font-mono">
                          1
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-muted-foreground/70">
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
                            <span className="text-xs text-muted-foreground font-mono truncate">
                              {repo.namespace}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Registry Endpoint */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 rounded-control bg-secondary/80 px-2 py-0.5 text-xs font-medium text-foreground">
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
                      <span className="rounded-control bg-secondary/60 border border-border/50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {repo.namespace && repo.namespace !== "_root" ? repo.namespace : "(root)"}
                      </span>
                    </td>

                    {/* Tags & Volume Bar */}
                    <td className="py-2.5 px-3">
                      <div className="flex flex-col gap-1 min-w-[110px]">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-semibold text-foreground">
                            {repo.tagCount !== undefined ? `${repo.tagCount} tags` : "—"}
                          </span>
                          {totalTags > 0 && repo.tagCount ? (
                            <span className="text-xs text-muted-foreground">
                              {Math.round((repo.tagCount / totalTags) * 100)}%
                            </span>
                          ) : null}
                        </div>
                        <div
                          role="progressbar"
                          aria-valuenow={repo.tagCount ?? 0}
                          aria-valuemin={0}
                          aria-valuemax={maxTopTagCount}
                          aria-label={`Tag volume for ${repo.name}`}
                          className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                        >
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

                    {/* Action: Inspect */}
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
        <span className="truncate text-xs">
          {"Click any row to inspect tags and manifests."}
        </span>
        <Link
          href="/repos"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0 text-xs"
        >
          <span>{`View all ${repositories.length} repos`}</span>
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}
