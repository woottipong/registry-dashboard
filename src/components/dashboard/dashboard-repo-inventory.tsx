"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightIcon,
  DatabaseIcon,
  FolderIcon,
  SearchIcon,
  ServerIcon,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatEstimatedSize } from "@/lib/format"
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
  maxTopTagCount: number
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
  maxTopTagCount,
}: DashboardRepoInventoryProps) {
  const router = useRouter()

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
              onClick={() => onTabChange(reg.id)}
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
              onChange={(e) => onSearchChange(e.target.value)}
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
        <Link
          href="/repos"
          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0 text-[11px]"
        >
          <span>{"View catalog"}</span>
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}

