"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type { Repository } from "@/types/registry"

interface RepoCardProps {
  registryId: string
  repository: Repository
}

export function RepoCard({ registryId, repository }: RepoCardProps) {
  const router = useRouter()

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/repos/${registryId}/${repository.fullName}`)}
      className="cursor-pointer gap-4 transition hover:border-primary/60"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          router.push(`/repos/${registryId}/${repository.fullName}`)
        }
      }}
    >
      <CardHeader className="space-y-2">
        <CardTitle className="text-base">{repository.fullName}</CardTitle>
        <div className="flex flex-wrap gap-2">
          {repository.isOfficial ? <Badge>Official</Badge> : null}
          {typeof repository.pullCount === "number" ? (
            <Badge variant="secondary">{repository.pullCount.toLocaleString()} pulls</Badge>
          ) : null}
          {typeof repository.starCount === "number" ? (
            <Badge variant="outline">{repository.starCount.toLocaleString()} stars</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <span>Tags: {repository.tagCount ?? "-"}</span>
        <span>Size: {repository.sizeBytes ? `${Math.round(repository.sizeBytes / 1024)} KB` : "-"}</span>
        <span className="col-span-2">
          Updated: {repository.lastUpdated ? formatDate(repository.lastUpdated) : "Unknown"}
        </span>
      </CardContent>
    </Card>
  )
}
