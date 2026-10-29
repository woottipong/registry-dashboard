"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { FolderIcon } from "lucide-react"
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
      <TableHeader className="bg-secondary/25">
        <TableRow className="border-b border-border/70 hover:bg-transparent">
          <TableHead className="py-2.5 px-4 text-xs font-medium text-muted-foreground">
            Repository
          </TableHead>
          <TableHead className="py-2.5 px-4 text-right text-xs font-medium text-muted-foreground">
            Tags
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <TableRow
            key={repo.fullName}
            className="cursor-pointer border-b border-border/50 hover:bg-secondary/40 transition-colors"
            onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
            onMouseEnter={() => setHoveredRepo(repo)}
            onMouseLeave={() => setHoveredRepo(null)}
          >
            <TableCell className="py-2.5 px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <FolderIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/repos/${registryId}/${repo.fullName}`}
                      onClick={(event) => event.stopPropagation()}
                      className="truncate font-semibold text-xs text-foreground hover:text-primary"
                    >
                      {repo.name}
                    </Link>
                    {repo.isOfficial ? (
                      <span className="rounded-control bg-secondary px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                        Official
                      </span>
                    ) : null}
                    {repo.isPrivate ? (
                      <span className="rounded-control bg-secondary px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground">
                        Private
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">{repo.fullName}</p>
                </div>
              </div>
            </TableCell>

            <TableCell className="py-2.5 px-4 text-right">
              <span className="inline-flex items-center gap-1 rounded-control bg-secondary/60 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                <span className="size-1 rounded-full bg-success" />
                <span>{formatCount(repo.tagCount)}</span>
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function formatCount(value?: number): string {
  if (value === undefined) return "Tags unavailable"
  return value === 1 ? "1 tag" : `${value} tags`
}
