"use client"

import Link from "next/link"
import { useMemo } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  DatabaseIcon,
  KeyRoundIcon,
  LayersIcon,
  LockIcon,
  LockOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
  ServerIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConnectionStatus } from "@/components/registry/connection-status"
import { usePingRegistry } from "@/hooks/use-registries"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface RegistryCardProps {
  registry: RegistryConnection
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  isActionPending?: boolean
  className?: string
}

export function RegistryCard({
  registry,
  onDelete,
  onSetDefault,
  isActionPending = false,
  className,
}: RegistryCardProps) {
  const ping = usePingRegistry(registry.id)

  const status = ping.isPending
    ? "checking"
    : ping.isError || ping.data?.status === "error"
      ? "error"
      : ping.data?.status === "ok"
        ? "connected"
        : null
  const latencyMs = ping.data?.latencyMs ?? null

  const rateLimitPercent = useMemo(() => {
    if (!registry.rateLimit?.limit || registry.rateLimit.remaining === null) {
      return null
    }

    return Math.max(
      0,
      Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100),
    )
  }, [registry.rateLimit])

  const providerLabel = registry.provider === "dockerhub" ? "Docker Hub" : "Registry V2"
  const authVisual = {
    none: { Icon: LockOpenIcon, label: "Anonymous" },
    basic: { Icon: LockIcon, label: "Basic Auth" },
    bearer: { Icon: KeyRoundIcon, label: "Token" },
  }[registry.authType]
  const capabilityLabels = getCapabilityLabels(registry)
  const registryHost = safeGetHost(registry.url)

  function runPing() {
    ping.mutate(undefined, {
      onError: (error) => {
        toast.error(error.message)
      },
    })
  }

  return (
    <div
      className={cn(
        "group flex flex-col justify-between gap-4 rounded-control border border-border/70 bg-secondary/20 p-4 transition-all duration-150 hover:bg-secondary/40 hover:border-primary/40",
        className,
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-control bg-secondary text-primary border border-border/50">
            {registry.provider === "dockerhub" ? (
              <ServerIcon className="size-4" />
            ) : (
              <DatabaseIcon className="size-4 text-primary" />
            )}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h3 className="truncate text-sm font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {registry.name}
            </h3>
            <p className="truncate font-mono text-xs text-muted-foreground" title={registry.url}>
              {registryHost}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {registry.isDefault ? (
            <span className="inline-flex items-center gap-1 rounded-control bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-[11px] font-mono font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Default
            </span>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-control text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                aria-label="Registry actions"
              >
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-control p-1 shadow-overlay border border-panel-border bg-popover">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={runPing} disabled={ping.isPending} className="rounded-control cursor-pointer">
                  <RefreshCwIcon className={cn("mr-1.5 size-3.5", ping.isPending && "animate-spin")} />
                  {ping.isPending ? "Testing..." : "Test"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-control cursor-pointer">
                  <Link href={`/registries/${registry.id}/edit`}>
                    <PencilIcon className="mr-1.5 size-3.5" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {!registry.isDefault ? (
                  <DropdownMenuItem onClick={() => onSetDefault(registry.id)} disabled={isActionPending} className="rounded-control cursor-pointer">
                    <CheckIcon className="mr-1.5 size-3.5" />
                    Set Default
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="rounded-control">
                    <StarIcon className="mr-1.5 size-3.5 text-primary" />
                    Default
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(registry.id)} disabled={isActionPending} className="rounded-control cursor-pointer">
                  <Trash2Icon className="mr-1.5 size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Badges & Telemetry Strip */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
        <span className="inline-flex items-center rounded-control bg-secondary/80 border border-border/60 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
          {providerLabel}
        </span>

        <span className="inline-flex items-center gap-1 rounded-control bg-secondary/60 border border-border/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          <authVisual.Icon className="size-3" />
          <span>{authVisual.label}</span>
        </span>

        <span className="inline-flex items-center gap-1 rounded-control bg-secondary/60 border border-border/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          <LayersIcon className="size-3" />
          <span>{registry.namespace ?? "Global scope"}</span>
        </span>

        <ConnectionStatus state={status} latencyMs={latencyMs} compact />
        {status === null ? (
          <span className="inline-flex items-center rounded-control bg-secondary/60 border border-border/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            Not tested
          </span>
        ) : null}
      </div>

      {/* Capabilities Row */}
      {capabilityLabels.length > 0 ? (
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[11px] text-muted-foreground font-mono">Capabilities</span>
          <div className="flex flex-wrap items-center gap-1">
            {capabilityLabels.map((cap) => (
              <span
                key={cap}
                className="rounded-control bg-background/50 border border-border/40 px-1.5 py-0.2 font-mono text-[10px] text-muted-foreground"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Quota / Rate limit (if applicable) */}
      {typeof rateLimitPercent === "number" ? (
        <div className="rounded-control bg-secondary/30 p-2.5 border border-border/40 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">Rate limit quota</span>
            <span className="text-foreground font-medium">
              {registry.rateLimit?.remaining ?? 0} / {registry.rateLimit?.limit ?? 0} ({rateLimitPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${rateLimitPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Button
          variant="outline"
          size="sm"
          onClick={runPing}
          disabled={ping.isPending}
          className="h-8 rounded-control px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer shadow-xs border-border/70 hover:bg-secondary"
        >
          <RefreshCwIcon className={cn("size-3", ping.isPending && "animate-spin text-primary")} />
          <span>{ping.isPending ? "Testing..." : "Test"}</span>
        </Button>

        <Button size="sm" className="h-8 rounded-control gap-1.5 px-3 text-xs font-medium cursor-pointer shadow-xs" asChild>
          <Link href={`/repos?registry=${registry.id}`}>
            <span>Browse repositories</span>
            <ArrowRightIcon className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function getCapabilityLabels(registry: RegistryConnection): string[] {
  const labels: string[] = []

  if (registry.capabilities?.canListCatalog) labels.push("Catalog")
  if (registry.capabilities?.canSearch) labels.push("Search")
  if (registry.capabilities?.canDelete) labels.push("Delete")
  if (registry.capabilities?.hasRateLimit) labels.push("Rate limits")

  return labels
}

function safeGetHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
