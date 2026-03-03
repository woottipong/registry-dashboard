"use client"

import { useRouter } from "next/navigation"
import { TagsIcon } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Repository } from "@/types/registry"

interface RepoCardProps {
  registryId: string
  repository: Repository
}

export function RepoCard({ registryId, repository }: RepoCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["tags", registryId, repository.fullName],
      staleTime: 30 * 1000,
      queryFn: async () => {
        const encodedRepoPath = repository.fullName
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/")
        const response = await fetch(
          `/api/v1/registries/${registryId}/repositories/${encodedRepoPath}/tags`,
          { cache: "no-store" },
        )
        const payload = await response.json()
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message ?? "Unable to fetch tags")
        }
        return { items: payload.data, meta: payload.meta }
      },
    })
  }

  const navigateToTags = () => {
    router.push(`/repos/${registryId}/${repository.fullName}`)
  }

  return (
    <Card
      className="group relative flex flex-col h-full transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden bg-card/40 backdrop-blur-sm rounded-3xl"
      onMouseEnter={handleMouseEnter}
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="size-2 rounded-full bg-primary animate-ping" />
      </div>

      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-wrap gap-2">
          {repository.isOfficial && (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
              Official
            </Badge>
          )}
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider">
            {repository.tagCount ?? 0} Tags
          </Badge>
        </div>

        <CardTitle className="text-lg font-bold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {repository.fullName}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border/50 bg-secondary/30 p-3 space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider text-center">Pulls</p>
            <p className="text-sm font-bold text-center">{typeof repository.pullCount === "number" ? repository.pullCount.toLocaleString() : "-"}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-secondary/30 p-3 space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-wider text-center">Stars</p>
            <p className="text-sm font-bold text-center">{typeof repository.starCount === "number" ? repository.starCount.toLocaleString() : "-"}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          onClick={navigateToTags}
          className="w-full h-11 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/10 transition-all active:scale-95 bg-primary hover:bg-primary/90 text-white border-0"
        >
          <TagsIcon className="size-4" />
          Browse Image
        </Button>
      </CardFooter>
    </Card>
  )
}
