"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowRightIcon, FolderIcon } from "lucide-react"
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
import { formatEstimatedSize } from "@/lib/format"
import type { Repository } from "@/types/registry"

interface RepoTableProps {
  registryId: string
  repositories: Repository[]
}

function formatTagText(value?: number): string {
  if (value === undefined) return "Tags unavailable"
  if (value === 0) return "0 tags"
  return value === 1 ? "1 tag" : `${value} tags`
}

export function RepoTable({ registryId, repositories }: RepoTableProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [hoveredRepo, setHoveredRepo] = useState<Repository | null>(null)
  const debouncedHoveredRepo = useDebounce(hoveredRepo, 200)

  const maxTagCount = useMemo(
    () => Math.max(...repositories.map((r) => r.tagCount ?? 0), 1),
    [repositories],
  )

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
    <div className="overflow-x-auto">
      <Table className="w-full text-left text-xs">
        <TableHeader className="border-b border-border/70 bg-secondary/25">
          <TableRow className="border-b border-border/70 hover:bg-transparent text-muted-foreground">
            <TableHead className="w-9 py-2.5 pl-3.5 pr-1 font-mono text-center text-xs">#</TableHead>
            <TableHead className="py-2.5 px-3 font-medium">Repository</TableHead>
            <TableHead className="py-2.5 px-3 font-medium hidden sm:table-cell">Namespace</TableHead>
            <TableHead className="py-2.5 px-3 font-medium min-w-[130px]">Tags & Volume</TableHead>
            <TableHead className="py-2.5 px-3 font-medium text-right hidden sm:table-cell" title="Confirmed layer size from manifest">
              Size
            </TableHead>
            <TableHead className="w-10 py-2.5 pl-2 pr-4 text-right font-medium" aria-label="Inspect" />
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border/50 font-sans">
          {repositories.map((repo, idx) => {
            const hasTags = repo.tagCount !== undefined && repo.tagCount > 0
            const volumePercentage = hasTags
              ? Math.max(Math.round(((repo.tagCount ?? 0) / maxTagCount) * 100), 8)
              : 0

            return (
              <TableRow
                key={repo.fullName}
                onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
                onMouseEnter={() => setHoveredRepo(repo)}
                onMouseLeave={() => setHoveredRepo(null)}
                className="group cursor-pointer hover:bg-secondary/40 text-foreground/90 transition-colors duration-100"
              >
                {/* # Rank */}
                <TableCell className="w-9 py-2.5 pl-3.5 pr-1 text-center font-mono">
                  <span className="text-xs font-mono text-muted-foreground/70">
                    {idx + 1}
                  </span>
                </TableCell>

                {/* Repository Name & Path */}
                <TableCell className="py-2.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <FolderIcon className="size-3.5 shrink-0 transition-colors text-muted-foreground group-hover:text-primary" />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/repos/${registryId}/${repo.fullName}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-semibold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px] hover:underline focus-visible:outline-none focus-visible:underline"
                        >
                          {repo.name}
                        </Link>
                        {repo.isOfficial ? (
                          <span className="rounded-control bg-secondary px-1.5 py-0.2 font-mono text-xs text-muted-foreground border border-border/50">
                            Official
                          </span>
                        ) : null}
                        {repo.isPrivate ? (
                          <span className="rounded-control bg-secondary px-1.5 py-0.2 font-mono text-xs text-muted-foreground border border-border/50">
                            Private
                          </span>
                        ) : null}
                      </div>
                      <span className="truncate font-mono text-xs text-muted-foreground">
                        {repo.fullName}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Namespace */}
                <TableCell className="py-2.5 px-3 hidden sm:table-cell">
                  <span className="rounded-control bg-secondary/60 border border-border/50 px-1.5 py-0.2 font-mono text-xs text-muted-foreground">
                    {repo.namespace && repo.namespace !== "_root" ? repo.namespace : "(root)"}
                  </span>
                </TableCell>

                {/* Tags & Volume Bar */}
                <TableCell className="py-2.5 px-3">
                  <div className="flex flex-col gap-1 min-w-[110px]">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-foreground">
                        {formatTagText(repo.tagCount)}
                      </span>
                      {hasTags ? (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(((repo.tagCount ?? 0) / maxTagCount) * 100)}%
                        </span>
                      ) : null}
                    </div>
                    {hasTags ? (
                      <div
                        role="progressbar"
                        aria-valuenow={repo.tagCount ?? 0}
                        aria-valuemin={0}
                        aria-valuemax={maxTagCount}
                        aria-label={`Tag volume for ${repo.name}`}
                        className="h-1.5 w-full rounded-full bg-secondary overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full bg-primary/80 transition-all duration-300"
                          style={{ width: `${volumePercentage}%` }}
                        />
                      </div>
                    ) : null}
                  </div>
                </TableCell>

                {/* Confirmed Image Size */}
                <TableCell
                  className="py-2.5 px-3 text-right font-mono text-xs text-foreground whitespace-nowrap hidden sm:table-cell"
                  title="Confirmed layer size from manifest"
                >
                  {formatEstimatedSize(repo.tagCount, repo.sizeBytes)}
                </TableCell>

                {/* Action Link (Inspect) */}
                <TableCell className="w-10 py-2.5 pl-2 pr-4 text-right">
                  <Link
                    href={`/repos/${registryId}/${repo.fullName}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex size-6 items-center justify-center rounded-control text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 hover:bg-secondary transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    title={`Inspect ${repo.name} repository`}
                    aria-label={`Inspect ${repo.name} repository`}
                  >
                    <ArrowRightIcon className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
