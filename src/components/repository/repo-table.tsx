"use client"

import { useState, useEffect } from "react"
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
import { STALE_TIME_TAGS } from "@/lib/query-client"
import { queryKeys } from "@/lib/constants/query-keys"
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
      <TableHeader>
        <TableRow>
          <TableHead>Repository</TableHead>
          <TableHead>Full name</TableHead>
          <TableHead className="text-right">Tags</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {repositories.map((repo) => (
          <TableRow
            key={repo.fullName}
            className="cursor-pointer"
            onClick={() => router.push(`/repos/${registryId}/${repo.fullName}`)}
            onMouseEnter={() => setHoveredRepo(repo)}
            onMouseLeave={() => setHoveredRepo(null)}
          >
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <BoxIcon className="size-4 text-muted-foreground" />
                </div>
                <span className="font-medium">{repo.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">{repo.fullName}</TableCell>
            <TableCell className="text-right">
              <Badge variant="outline" className="justify-center">
                <TagsIcon />
                {(repo.tagCount ?? 0) === 1 ? "1 tag" : `${repo.tagCount ?? 0} tags`}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
