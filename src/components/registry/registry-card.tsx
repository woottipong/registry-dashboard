"use client"

import Link from "next/link"
import { useMemo, type ComponentType } from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  KeyRoundIcon,
  LockIcon,
  LockOpenIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RefreshCwIcon,
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
    : ping.data?.status === "ok"
      ? "connected"
      : ping.isError
        ? "error"
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
    <Card
      className={cn(
        "h-auto self-start overflow-hidden rounded-lg border-border/70 bg-card/95 py-0 shadow-sm gap-0",
        className,
      )}
    >
      <CardHeader className="gap-3 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <CardTitle className="truncate text-base tracking-tight">{registry.name}</CardTitle>
              <p className="truncate font-mono text-[13px] text-muted-foreground">{registryHost}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <RegistryFlag label={providerLabel} />
              {registry.isDefault ? (
                <Badge className="h-6 border-primary/10 bg-primary/10 text-primary shadow-none hover:bg-primary/10">
                  Default
                </Badge>
              ) : null}
              <ConnectionStatus state={status} latencyMs={latencyMs} compact />
              {status === null ? (
                <span className="inline-flex h-6 items-center rounded-full border border-border/70 bg-background/72 px-2 text-[11px] font-medium text-muted-foreground">
                  Not tested
                </span>
              ) : null}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                className="shrink-0 rounded-full border-border/70 bg-background/82"
                aria-label="Registry actions"
              >
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
                  <DropdownMenuItem onClick={() => onSetDefault(registry.id)} disabled={isActionPending}>
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
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(registry.id)} disabled={isActionPending}>
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <RegistryMetaChip icon={authVisual.Icon} label={authVisual.label} />
          <RegistryMetaChip label={registry.namespace ?? "Global scope"} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 px-4 pb-3 pt-0">
        {capabilityLabels.length > 0 ? (
          <DetailRow label="Capabilities" value={capabilityLabels.join(" • ")} />
        ) : null}

        {typeof rateLimitPercent === "number" ? (
          <div className="rounded-lg border border-border/70 bg-background/72 px-3 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Quota
                </p>
                <p className="text-xs text-foreground/78">
                  {registry.rateLimit?.remaining ?? 0} / {registry.rateLimit?.limit ?? 0} remaining
                </p>
              </div>
              <p className="text-base font-semibold tabular-nums text-foreground/90">
                {rateLimitPercent.toFixed(0)}%
              </p>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-secondary/80">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-500"
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <Button size="sm" className="h-9 w-full" asChild>
          <Link href={`/repos?registry=${registry.id}`}>
            Browse
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface RegistryMetaChipProps {
  label: string
  icon?: ComponentType<{ className?: string }>
}

function RegistryFlag({ label }: { label: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full border border-border/70 bg-background px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </span>
  )
}

function RegistryMetaChip({ label, icon: Icon }: RegistryMetaChipProps) {
  return (
    <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background/72 px-3 py-2 text-[12px] font-medium text-foreground/72">
      {Icon ? <Icon className="size-3 text-muted-foreground" /> : null}
      <span>{label}</span>
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border/70 bg-background/56 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="text-xs text-foreground/78">{value}</p>
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
