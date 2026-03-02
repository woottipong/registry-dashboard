"use client"

import Link from "next/link"
import { FolderGit2Icon, RefreshCwIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConnectionStatus } from "@/components/registry/connection-status"
import { usePingRegistry } from "@/hooks/use-registries"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

interface RegistryOverviewCardProps {
  registry: RegistryConnection
  repoCount?: number
  tagCount?: number
}

function RegistryOverviewCard({ registry, repoCount, tagCount }: RegistryOverviewCardProps) {
  const ping = usePingRegistry(registry.id)

  const rateLimitPct =
    registry.rateLimit?.limit && registry.rateLimit.remaining !== null
      ? Math.max(0, Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100))
      : null

  function runPing() {
    ping.mutate(undefined, {
      onError: (err) => toast.error(err.message),
    })
  }

  const pingStatus = ping.data?.status === "ok" ? "connected" : ping.isError ? "error" : "checking"

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{registry.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{registry.url}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Badge variant="secondary">{registry.provider}</Badge>
            {registry.isDefault ? <Badge>Default</Badge> : null}
          </div>
        </div>
        <ConnectionStatus
          state={pingStatus}
          latencyMs={ping.data?.latencyMs ?? null}
          checkedAt={null}
        />
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="flex gap-6 text-muted-foreground">
          <span>{repoCount ?? "—"} repos</span>
          <span>{tagCount ?? "—"} tags</span>
        </div>

        {typeof rateLimitPct === "number" ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Rate limit — {registry.rateLimit?.remaining}/{registry.rateLimit?.limit} remaining
            </p>
            <div className="h-1.5 rounded-full bg-secondary">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${rateLimitPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/repos?registry=${registry.id}`}>
            <FolderGit2Icon className="size-4" />
            Browse
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={runPing} disabled={ping.isPending}>
          <RefreshCwIcon className="size-4" />
          Test
        </Button>
      </CardFooter>
    </Card>
  )
}

interface RegistryOverviewProps {
  registries: RegistryConnection[]
  isLoading?: boolean
}

export function RegistryOverview({ registries, isLoading }: RegistryOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!registries.length) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {registries.map((registry) => (
        <RegistryOverviewCard key={registry.id} registry={registry} />
      ))}
    </div>
  )
}
