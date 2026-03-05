"use client"

import Link from "next/link"
import { ServerIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface RegistryOverviewCardProps {
  registry: RegistryConnection
  repoCount?: number
  tagCount?: number
}

function RegistryListItem({ registry, repoCount, tagCount }: RegistryOverviewCardProps) {
  const rateLimitPct =
    registry.rateLimit?.limit && registry.rateLimit.remaining !== null
      ? Math.max(0, Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100))
      : null

  return (
    <div className="group flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center justify-between gap-4 p-6 transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/[0.03] hover:to-transparent border-b border-border/50 last:border-0 relative overflow-hidden">
      <div className="flex items-start gap-4 flex-1 min-w-[200px] z-10">
        <div className="relative shrink-0">
          <div className={cn(
            "h-12 w-12 flex items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-b from-card to-card/50 shadow-sm transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] group-hover:-translate-y-0.5",
            registry.isDefault && "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 shadow-primary/10"
          )}>
            <ServerIcon className={cn("size-5 transition-colors duration-300", registry.isDefault ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
          </div>
          {registry.isDefault && (
            <div className="absolute -top-1 -right-1 size-3.5 bg-primary rounded-full border-2 border-background shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          )}
        </div>

        <div className="flex flex-col min-w-0 gap-1.5 justify-center pt-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href={`/repos?registry=${registry.id}`} className="font-bold text-base hover:text-primary transition-colors line-clamp-1 break-all cursor-pointer">
              {registry.name}
            </Link>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 rounded-full px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider shrink-0">
              {registry.provider}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-medium flex-wrap">
            {registry.url && <span className="truncate max-w-[200px] sm:max-w-xs">{registry.url}</span>}
            <div className={cn("flex gap-4 items-center", registry.url && "ml-2 border-l border-border/60 pl-4")}>
              <span className="flex items-center gap-1.5">
                <strong className="text-foreground/90 font-bold">{repoCount ?? "0"}</strong> <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Repos</span>
              </span>
              <span className="flex items-center gap-1.5">
                <strong className="text-foreground/90 font-bold">{tagCount ?? "0"}</strong> <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Tags</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:ml-auto z-10 flex-wrap sm:flex-nowrap mt-2 sm:mt-0">
        {typeof rateLimitPct === "number" && (
          <div className="hidden lg:block text-right min-w-[120px]">
            <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] mb-2">Rate Limit</div>
            <div className="flex items-center gap-3 justify-end">
              <div className="w-24 h-1.5 rounded-full bg-secondary/50 overflow-hidden shadow-inner">
                <div
                  className={cn("h-full transition-all duration-1000 bg-gradient-to-r", rateLimitPct < 20 ? "from-destructive/80 to-destructive" : "from-primary/80 to-primary")}
                  style={{ width: `${rateLimitPct}%` }}
                />
              </div>
              <span className="text-xs font-bold font-mono text-foreground/80">{registry.rateLimit?.remaining}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button size="sm" className="h-10 px-5 rounded-xl font-bold bg-gradient-to-br from-primary to-primary/90 text-white shadow-[0_4px_14px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shrink-0" asChild>
            <Link href={`/repos?registry=${registry.id}`}>
              Browse
            </Link>
          </Button>
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-primary via-chart-2 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
      <div className="flex flex-col gap-4 p-2 min-h-[300px]">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="group flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap sm:items-center justify-between gap-4 p-6 transition-all duration-300 border-b border-border/50 last:border-0 relative overflow-hidden animate-pulse"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-start gap-4 flex-1 min-w-[200px]">
              <div className="relative shrink-0">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-b from-muted/50 to-muted/30 shadow-sm border border-border/40">
                  <div className="w-5 h-5 bg-muted-foreground/30 rounded"></div>
                </div>
              </div>

              <div className="flex flex-col min-w-0 gap-1.5 justify-center pt-0.5 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="h-5 bg-muted-foreground/40 rounded w-32"></div>
                  <div className="h-4 bg-primary/20 rounded-full px-2 py-0.5 w-16"></div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground/60 font-medium flex-wrap">
                  <div className="h-3 bg-muted-foreground/20 rounded w-24"></div>
                  <div className="flex gap-4 items-center ml-2 border-l border-border/60 pl-4">
                    <div className="h-3 bg-muted-foreground/15 rounded w-8"></div>
                    <div className="h-3 bg-muted-foreground/15 rounded w-10"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="h-4 bg-muted-foreground/30 rounded w-12 mb-1"></div>
                <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
              </div>
              <div className="h-8 w-20 bg-primary/20 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!registries.length) return null

  return (
    <div className="flex flex-col gap-3 p-2 min-h-[300px]">
      {registries.map((registry) => (
        <RegistryListItem key={registry.id} registry={registry} />
      ))}
      {registries.length === 0 && (
        <div className="flex items-center justify-center h-[200px] text-muted-foreground/50">
          <div className="text-center">
            <ServerIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No registries connected</p>
          </div>
        </div>
      )}
    </div>
  )
}
