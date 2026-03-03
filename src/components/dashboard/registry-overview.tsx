"use client"

import Link from "next/link"
import { FolderGit2Icon, RefreshCwIcon, ServerIcon } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ConnectionStatus } from "@/components/registry/connection-status"
import { usePingRegistry } from "@/hooks/use-registries"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface RegistryOverviewCardProps {
  registry: RegistryConnection
  repoCount?: number
  tagCount?: number
}

function RegistryListItem({ registry, repoCount, tagCount }: RegistryOverviewCardProps) {
  const ping = usePingRegistry(registry.id)

  const rateLimitPct =
    registry.rateLimit?.limit && registry.rateLimit.remaining !== null
      ? Math.max(0, Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100))
      : null

  function runPing() {
    ping.mutate(undefined, {
      onError: (err) => toast.error(err.message),
      onSuccess: () => toast.success(`Successfully pinged ${registry.name}`)
    })
  }

  const pingStatus = ping.data?.status === "ok" ? "connected" : ping.isError ? "error" : "checking"

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-md bg-card transition-colors hover:bg-muted/30">

      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="hidden sm:flex mt-0.5 h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
          <ServerIcon className="size-4 text-muted-foreground" />
        </div>

        <div className="flex flex-col min-w-0 gap-1.5">
          <div className="flex items-center gap-2">
            <Link href={`/repos?registry=${registry.id}`} className="font-semibold text-sm hover:underline truncate">
              {registry.name}
            </Link>
            <Badge variant="secondary" className="rounded-sm font-mono text-[10px] px-1.5 py-0">
              {registry.provider}
            </Badge>
            {registry.isDefault && (
              <Badge variant="outline" className="rounded-sm text-[10px] px-1.5 py-0 border-primary text-primary">
                Default
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="truncate max-w-[200px] sm:max-w-xs">{registry.url}</span>
            <span className="hidden sm:inline text-border">•</span>
            <div className="hidden sm:flex gap-3">
              <span><strong className="text-foreground">{repoCount ?? "—"}</strong> repos</span>
              <span><strong className="text-foreground">{tagCount ?? "—"}</strong> tags</span>
            </div>
          </div>

          <div className="flex sm:hidden gap-3 text-xs text-muted-foreground mt-1">
            <span><strong className="text-foreground">{repoCount ?? "—"}</strong> repos</span>
            <span><strong className="text-foreground">{tagCount ?? "—"}</strong> tags</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:ml-auto">
        {typeof rateLimitPct === "number" && (
          <div className="hidden md:block text-right">
            <div className="text-[10px] text-muted-foreground mb-1">Rate Limit</div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full", rateLimitPct < 20 ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${rateLimitPct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono">{registry.rateLimit?.remaining}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <ConnectionStatus
            state={pingStatus}
            latencyMs={ping.data?.latencyMs ?? null}
            checkedAt={null}
          />
          <span className="text-border mx-1">|</span>
          <Button variant="ghost" size="icon" onClick={runPing} disabled={ping.isPending} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <RefreshCwIcon className={cn("size-3.5", ping.isPending && "animate-spin")} />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 px-3" asChild>
            <Link href={`/repos?registry=${registry.id}`}>
              Browse
            </Link>
          </Button>
        </div>
      </div>

    </div>
  )
}

interface RegistryOverviewProps {
  registries: RegistryConnection[]
  isLoading?: boolean
}

export function RegistryOverview({ registries, isLoading }: RegistryOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
      </div>
    )
  }

  if (!registries.length) return null

  return (
    <div className="flex flex-col gap-3">
      {registries.map((registry) => (
        <RegistryListItem key={registry.id} registry={registry} />
      ))}
    </div>
  )
}
