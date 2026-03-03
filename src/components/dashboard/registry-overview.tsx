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
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 transition-all duration-300 hover:bg-primary/[0.02] border-b border-border/50 last:border-0 relative overflow-hidden">
      <div className="flex items-start gap-4 flex-1 min-w-0 z-10">
        <div className="relative shrink-0">
          <div className={cn(
            "h-12 w-12 flex items-center justify-center rounded-2xl border border-border bg-background transition-all group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5",
            registry.isDefault && "border-primary/20 bg-primary/[0.02]"
          )}>
            <ServerIcon className={cn("size-5", registry.isDefault ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
          </div>
          {registry.isDefault && (
            <div className="absolute -top-1 -right-1 size-3 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex flex-col min-w-0 gap-1.5 justify-center">
          <div className="flex items-center gap-2.5">
            <Link href={`/repos?registry=${registry.id}`} className="font-bold text-base hover:text-primary transition-colors truncate">
              {registry.name}
            </Link>
            <Badge variant="secondary" className="bg-muted-foreground/5 text-muted-foreground border-none rounded-full px-2 py-0 text-[10px] uppercase font-bold tracking-tighter">
              {registry.provider}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-medium">
            <span className="truncate max-w-[200px] sm:max-w-xs">{registry.url}</span>
            <div className="flex gap-4 ml-2 border-l border-border/50 pl-4 items-center">
              <span className="flex items-center gap-1.5">
                <strong className="text-foreground font-black">{repoCount ?? "0"}</strong> <span className="text-[10px] uppercase tracking-wider">Repos</span>
              </span>
              <span className="flex items-center gap-1.5">
                <strong className="text-foreground font-black">{tagCount ?? "0"}</strong> <span className="text-[10px] uppercase tracking-wider">Tags</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 sm:ml-auto z-10">
        {typeof rateLimitPct === "number" && (
          <div className="hidden lg:block text-right min-w-[120px]">
            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-2">Rate Limit</div>
            <div className="flex items-center gap-3 justify-end">
              <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-1000", rateLimitPct < 20 ? "bg-destructive" : "bg-primary")}
                  style={{ width: `${rateLimitPct}%` }}
                />
              </div>
              <span className="text-[11px] font-black font-mono text-foreground/80">{registry.rateLimit?.remaining}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="bg-card px-3 py-1.5 rounded-xl border border-border/50 flex items-center gap-3 group/ping">
            <ConnectionStatus
              state={pingStatus}
              latencyMs={ping.data?.latencyMs ?? null}
              checkedAt={null}
            />
            <button
              onClick={runPing}
              className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              disabled={ping.isPending}
            >
              <RefreshCwIcon className={cn("size-3.5", ping.isPending && "animate-spin")} />
            </button>
          </div>

          <Button size="sm" className="h-9 px-5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all" asChild>
            <Link href={`/repos?registry=${registry.id}`}>
              Browse
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
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
