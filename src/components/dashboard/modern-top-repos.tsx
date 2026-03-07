"use client"

import Link from "next/link"
import { FolderIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface TopRepoItem {
  name: string
  registryId: string
  tagCount: number
  registryName?: string
}

interface ModernTopReposProps {
  repos: TopRepoItem[]
  isLoading?: boolean
}

export function ModernTopRepos({ repos, isLoading }: ModernTopReposProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50"
          >
            <Skeleton className="size-6 rounded-md shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    )
  }

  if (repos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center py-8">
          <FolderIcon className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No repositories found</p>
        </div>
      </div>
    )
  }

  const maxTags = repos[0]?.tagCount ?? 1

  return (
    <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
      {repos.map((repo, index) => {
        const barWidth = Math.max(4, Math.round((repo.tagCount / maxTags) * 100))
        return (
          <Link
            key={`${repo.registryId}-${repo.name}`}
            href={`/repos/${repo.registryId}/${repo.name}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 hover:border-primary/20 transition-colors group"
          >
            {/* Rank badge */}
            <div className={cn(
              "size-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0",
              index === 0 ? "bg-chart-3/10 text-chart-3" :
                index === 1 ? "bg-muted-foreground/10 text-muted-foreground" :
                  index === 2 ? "bg-muted-foreground/10 text-muted-foreground" :
                    "bg-muted text-muted-foreground"
            )}>
              {index + 1}
            </div>

            {/* Repo name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {repo.name}
                </span>
                {repo.registryName && (
                  <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                    {repo.registryName}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/40 rounded-full"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>

            {/* Tag count */}
            <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground flex-shrink-0">
              <TagIcon className="size-3" />
              {repo.tagCount}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
