"use client"

import { useMemo } from "react"
import { ArrowRightIcon, ChevronRightIcon, FolderIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { parseRepositoryName } from "@/lib/format"
import type { Namespace, Repository } from "@/types/registry"

export interface NamespaceListProps {
  namespaces: Namespace[]
  allRepositories: Repository[]
  totalRepositories: number
  onSelect: (namespace: string) => void
}

export function NamespaceList({
  namespaces,
  allRepositories,
  totalRepositories,
  onSelect,
}: NamespaceListProps) {
  const sortedNamespaces = useMemo(() => {
    return [...namespaces].sort((a, b) => {
      if (b.repositoryCount !== a.repositoryCount) {
        return b.repositoryCount - a.repositoryCount
      }
      return a.name.localeCompare(b.name)
    })
  }, [namespaces])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sortedNamespaces.map((namespace) => {
        const isRoot = namespace.name === ""
        const label = isRoot ? "(root)" : namespace.name

        // Find repositories belonging to this namespace
        const nsRepos = allRepositories.filter((repo) => {
          const parsed = parseRepositoryName(repo.fullName)
          const repoNs = repo.namespace || parsed.namespace
          if (isRoot) {
            return !repoNs || repoNs === "_root" || repoNs === "root"
          }
          return repoNs === namespace.name
        })

        const sampleRepos = nsRepos.slice(0, 3)
        const remainingCount = Math.max(namespace.repositoryCount - sampleRepos.length, 0)
        const sharePercentage =
          totalRepositories > 0
            ? Math.round((namespace.repositoryCount / totalRepositories) * 100)
            : 0

        return (
          <button
            key={namespace.name || "_root"}
            type="button"
            onClick={() => onSelect(namespace.name)}
            className="group flex flex-col justify-between gap-3 w-full cursor-pointer rounded-control border border-border/70 bg-secondary/25 p-4 text-left transition-all duration-150 hover:bg-secondary/50 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
          >
            {/* Top row: Icon + Name + Badge + Arrow */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-control bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
                  <FolderIcon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors font-mono">
                    {label}{isRoot ? "" : "/"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {isRoot ? "Root namespace partition" : "Namespace partition"}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <span className="inline-flex items-center rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                  {namespace.repositoryCount} <span className="text-muted-foreground ml-1">repos</span>
                </span>
                <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>
            </div>

            {/* Middle & Volume Distribution */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
              {sampleRepos.length > 0 ? (
                <div className="flex flex-wrap gap-1 min-h-[22px] items-center">
                  {sampleRepos.map((r) => (
                    <span
                      key={r.fullName}
                      className="inline-flex items-center rounded-control bg-background/60 border border-border/50 px-1.5 py-0.2 font-mono text-xs text-muted-foreground group-hover:text-foreground truncate max-w-[130px]"
                      title={r.name}
                    >
                      {r.name}
                    </span>
                  ))}
                  {remainingCount > 0 ? (
                    <span className="font-mono text-xs text-muted-foreground/70">
                      +{remainingCount} more
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="font-mono text-xs">Partition volume</span>
                  <span className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRightIcon className="size-2.5" />
                  </span>
                </div>
              )}

              {/* Share volume bar */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>{sharePercentage}% of registry</span>
                  <span>{namespace.repositoryCount} {namespace.repositoryCount === 1 ? "repo" : "repos"}</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={sharePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Repository share for ${label}`}
                  className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-300"
                    style={{ width: `${Math.max(sharePercentage, 8)}%` }}
                  />
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export function NamespaceSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex flex-col justify-between gap-3 rounded-control border border-border/60 bg-secondary/20 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-control" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="h-5 w-14 rounded-control" />
          </div>
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            <Skeleton className="h-4 w-3/4 rounded-control" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RepoSkeleton() {
  return (
    <div className="overflow-hidden space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between rounded-control bg-secondary/20 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-6 rounded-control" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-48 max-w-[50vw]" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-control" />
        </div>
      ))}
    </div>
  )
}

