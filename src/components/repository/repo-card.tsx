"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="group flex flex-col gap-4 transition-all hover:border-primary/50 hover:shadow-md">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium leading-tight tracking-tight">
            {repository.fullName}
          </CardTitle>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {repository.isOfficial ? (
            <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
              Official
            </Badge>
          ) : null}
          {typeof repository.pullCount === "number" ? (
            <Badge variant="secondary" className="font-mono text-xs">
              {repository.pullCount.toLocaleString()} pulls
            </Badge>
          ) : null}
          {typeof repository.starCount === "number" ? (
            <Badge variant="outline" className="font-mono text-xs">
              {repository.starCount.toLocaleString()} ⭐
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <span className="font-medium text-foreground">Tags</span>
            <p className="font-mono">{repository.tagCount ?? "-"}</p>
          </div>
          <div className="space-y-1">
            <span className="font-medium text-foreground">Size</span>
            <p className="font-mono">
              {repository.sizeBytes ? `${Math.round(repository.sizeBytes / 1024 / 1024)} MB` : "-"}
            </p>
          </div>
          <div className="col-span-2 space-y-1 border-t border-border/50 pt-2">
            <span className="font-medium text-foreground">Last Updated</span>
            <p>{repository.lastUpdated ? formatDate(repository.lastUpdated) : "Unknown"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center gap-2">
        <Button
          size="sm"
          className="w-full flex-1"
          onClick={() => router.push(`/repos/${registryId}/${repository.fullName}`)}
        >
          Explore Tags
        </Button>
        {onDelete ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(repository.fullName)}
          >
            Delete
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
