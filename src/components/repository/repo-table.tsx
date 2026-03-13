"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { BoxIcon, ChevronRightIcon, TagsIcon } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { STALE_TIME_TAGS } from "@/lib/query-client"
import type { Repository } from "@/types/registry"

interface RepoTableProps {
  registryId: string
  repositories: Repository[]
}

export function RepoTable({ registryId, repositories }: RepoTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [hoveredRepo, setHoveredRepo] = useState<Repository | null>(null)
  const debouncedHoveredRepo = useDebounce(hoveredRepo, 200)

  useEffect(() => {
    if (!debouncedHoveredRepo) return
    const repo = debouncedHoveredRepo
    queryClient.prefetchQuery({
      queryKey: ["tags", registryId, repo.fullName],
      staleTime: STALE_TIME_TAGS,
      queryFn: async () => {
        const encodedRepoPath = repo.fullName
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")
        const response = await fetch(
          `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags`,
          { cache: "no-store" },
        )
        const payload = await response.json()
        if (!response.ok || !payload.success || payload.data === null) {
          throw new Error(payload.error?.message ?? "Unable to fetch tags")
        }
        return { items: payload.data, meta: payload.meta }
      },
    })
  }, [debouncedHoveredRepo, registryId, queryClient])

  return (
    <ul className="divide-y divide-border" role="list">
      {repositories.map((repo) => (
        <li key={repo.fullName}>
        <button
          type="button"
          className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group"
          onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
          onMouseEnter={() => setHoveredRepo(repo)}
          onMouseLeave={() => setHoveredRepo(null)}
        >
          {/* Icon */}
          <div className="flex-shrink-0 size-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <BoxIcon className="size-4 text-primary/70" />
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {repo.name}
            </p>
            {repo.fullName !== repo.name && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.fullName}</p>
            )}
          </div>

          {/* Tag count badge */}
          {(repo.tagCount ?? 0) > 0 && (
            <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
              <TagsIcon className="size-3" />
              <span>{repo.tagCount} {repo.tagCount === 1 ? "tag" : "tags"}</span>
            </div>
          )}

          {/* Arrow */}
          <ChevronRightIcon className="flex-shrink-0 size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
        </button>
        </li>
      ))}
    </ul>
  )
}
