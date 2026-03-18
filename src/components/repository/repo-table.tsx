"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { BoxIcon, Clock3Icon, TagsIcon } from "lucide-react"
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
import { formatDate } from "@/lib/format"
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
          <TableHead className="px-6 py-4">Repository</TableHead>
          <TableHead className="hidden px-4 py-4 md:table-cell">Updated</TableHead>
          <TableHead className="px-6 py-4 text-right">Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <TableRow
            key={repo.fullName}
            className="cursor-pointer border-b border-border/60 hover:bg-muted/35"
            onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
            onMouseEnter={() => setHoveredRepo(repo)}
            onMouseLeave={() => setHoveredRepo(null)}
          >
            <TableCell className="px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BoxIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{repo.name}</span>
                    {repo.isOfficial ? <Badge variant="outline">Official</Badge> : null}
                    {repo.isPrivate ? <Badge variant="secondary">Private</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{repo.fullName}</p>
                </div>
              </div>
            </TableCell>

            <TableCell className="hidden px-4 py-4 md:table-cell">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3Icon className="size-4" />
                <span>{repo.lastUpdated ? formatDate(repo.lastUpdated) : "Unknown"}</span>
              </div>
            </TableCell>

            <TableCell className="px-6 py-4 text-right">
              <Badge variant="outline" className="justify-center whitespace-nowrap">
                <TagsIcon className="size-3.5" />
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
