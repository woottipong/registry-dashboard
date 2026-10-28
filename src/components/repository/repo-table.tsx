"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { BoxIcon, TagsIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDebounce } from "@/hooks/use-debounce"
import { queryKeys } from "@/lib/constants/query-keys"
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
      queryKey: queryKeys.tags.prefix(registryId, repo.fullName),
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
    <Table>
      <TableHeader className="bg-transparent">
        <TableRow className="border-b border-border/70 hover:bg-transparent">
          <TableHead className="px-5 py-3 text-xs font-medium text-muted-foreground">
            Repository
          </TableHead>
          <TableHead className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">
            Tags
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <TableRow
            key={repo.fullName}
            className="cursor-pointer border-b border-border/60 hover:bg-secondary/40 transition-colors"
            onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
            onMouseEnter={() => setHoveredRepo(repo)}
            onMouseLeave={() => setHoveredRepo(null)}
          >
            <TableCell className="px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground">
                  <BoxIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold tracking-tight text-foreground">{repo.name}</span>
                    {repo.isOfficial ? <Badge variant="outline" className="rounded-full text-xs px-2">Official</Badge> : null}
                    {repo.isPrivate ? <Badge variant="secondary" className="rounded-full text-xs px-2">Private</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{repo.fullName}</p>
                </div>
              </div>
            </TableCell>

            <TableCell className="px-5 py-3.5 text-right">
              <Badge variant="secondary" className="h-6 justify-center whitespace-nowrap rounded-full px-2.5 font-mono text-xs text-foreground">
                <TagsIcon className="size-3" />
                <span>{formatCount(repo.tagCount)}</span>
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function formatCount(value?: number): string {
  const count = value ?? 0
  return count === 1 ? "1 tag" : `${count} tags`
}
