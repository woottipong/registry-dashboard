"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  KeyRoundIcon,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  className?: string
}

export function RegistryCard({
  registry,
  onDelete,
  onSetDefault,
  className,
}: RegistryCardProps) {
  const [checkedAt, setCheckedAt] = useState<string | null>(null)
  const ping = usePingRegistry(registry.id)

  const status = ping.data?.status === "ok" ? "connected" : ping.isError ? "error" : "checking"
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
  const capabilitySummary = summarizeCapabilities(registry)

  function runPing() {
    ping.mutate(undefined, {
      onSuccess: () => setCheckedAt(new Date().toISOString()),
      onError: (error) => {
        setCheckedAt(new Date().toISOString())
        toast.error(error.message)
      },
    })
  }

  return (
    <Card className={cn("overflow-hidden border-border/70 bg-card/90", className)}>
      <CardHeader className="gap-3 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate">{registry.name}</CardTitle>
              {registry.isDefault ? <Badge>Default</Badge> : null}
            </div>
            <p className="mt-2 truncate text-sm text-muted-foreground">{safeGetHost(registry.url)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{providerLabel}</span>
              <span>&bull;</span>
              <span>{authVisual.label}</span>
              {registry.namespace ? (
                <>
                  <span>&bull;</span>
                  <span>{registry.namespace}</span>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ServerIcon className="size-5" />
          </div>
        </div>

        <ConnectionStatus state={status} latencyMs={latencyMs} checkedAt={checkedAt} />
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-4">
        {capabilitySummary ? (
          <p className="text-sm text-muted-foreground">{capabilitySummary}</p>
        ) : null}

        {typeof rateLimitPercent === "number" ? (
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Quota</p>
                <p className="mt-2 text-sm text-muted-foreground">{registry.rateLimit?.remaining ?? 0} / {registry.rateLimit?.limit ?? 0} remaining</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">{rateLimitPercent.toFixed(0)}%</p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${rateLimitPercent}%` }} />
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center gap-2 border-t pt-4">
        <Button size="sm" className="flex-1" asChild>
          <Link href={`/repos?registry=${registry.id}`}>
            Browse
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Registry actions">
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={runPing} disabled={ping.isPending}>
                <RefreshCwIcon data-icon="inline-start" />
                {ping.isPending ? "Testing..." : "Test"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/registries/${registry.id}/edit`}>
                  <PencilIcon data-icon="inline-start" />
                  Edit
                </Link>
              </DropdownMenuItem>
              {!registry.isDefault ? (
                <DropdownMenuItem onClick={() => onSetDefault(registry.id)}>
                  <CheckIcon data-icon="inline-start" />
                  Set Default
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <StarIcon data-icon="inline-start" />
                  Default
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(registry.id)}>
                <Trash2Icon data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

function summarizeCapabilities(registry: RegistryConnection): string | null {
  const labels: string[] = []

  if (registry.capabilities?.canListCatalog) labels.push("Catalog")
  if (registry.capabilities?.canSearch) labels.push("Search")
  if (registry.capabilities?.canDelete) labels.push("Delete")
  if (registry.capabilities?.hasRateLimit) labels.push("Rate limits")

  return labels.length > 0 ? labels.join(" • ") : null
}

function safeGetHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
