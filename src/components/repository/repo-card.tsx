"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type { Repository } from "@/types/registry"

interface RepoCardProps {
  registryId: string
  repository: Repository
  onDelete?: (repositoryName: string) => void
}

export function RepoCard({ registryId, repository, onDelete }: RepoCardProps) {
  const router = useRouter()

  return (
    <Card className="gap-4">
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
      <CardContent className="pt-0 flex gap-2">
        <Button
          size="sm"
          onClick={() => router.push(`/repos/${registryId}/${repository.fullName}`)}
        >
          Explore Tags
        </Button>
        {onDelete ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(repository.fullName)}
          >
            Delete
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
