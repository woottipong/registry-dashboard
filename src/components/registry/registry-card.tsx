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
    <Card
      className={cn(
        "h-auto self-start overflow-hidden rounded-panel bg-card p-6 shadow-panel border-0 transition-shadow duration-200 gap-4",
        className,
      )}
    >
      <CardHeader className="gap-3 p-0">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="space-y-1">
              <CardTitle className="truncate text-base font-semibold tracking-tight">{registry.name}</CardTitle>
              <p className="truncate font-mono text-xs text-muted-foreground">{registryHost}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <RegistryFlag label={providerLabel} />
              {registry.isDefault ? (
                <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                  Default
                </span>
              ) : null}
              <ConnectionStatus state={status} latencyMs={latencyMs} compact />
              {status === null ? (
                <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2 text-xs font-medium text-muted-foreground">
                  Not tested
                </span>
              ) : null}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-control"
                aria-label="Registry actions"
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-control p-1 shadow-overlay border border-panel-border bg-popover">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={runPing} disabled={ping.isPending} className="rounded-control">
                  <RefreshCwIcon data-icon="inline-start" />
                  {ping.isPending ? "Testing..." : "Test"}
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-control">
                  <Link href={`/registries/${registry.id}/edit`}>
                    <PencilIcon data-icon="inline-start" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                {!registry.isDefault ? (
                  <DropdownMenuItem onClick={() => onSetDefault(registry.id)} disabled={isActionPending} className="rounded-control">
                    <CheckIcon data-icon="inline-start" />
                    Set Default
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="rounded-lg">
                    <StarIcon data-icon="inline-start" />
                    Default
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(registry.id)} disabled={isActionPending} className="rounded-lg">
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
        <p className="text-xs text-muted-foreground">Connection status reflects the latest test on this page.</p>
      </CardHeader>

      <CardContent className="space-y-2 p-0">
        {capabilityLabels.length > 0 ? (
          <DetailRow label="Capabilities" value={capabilityLabels.join(" • ")} />
        ) : null}

        {typeof rateLimitPercent === "number" ? (
          <div className="rounded-2xl bg-secondary/40 p-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Quota
                </p>
                <p className="text-xs text-foreground">
                  {registry.rateLimit?.remaining ?? 0} / {registry.rateLimit?.limit ?? 0} remaining
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {rateLimitPercent.toFixed(0)}%
              </p>
            </div>
            <div className="mt-2.5 h-1.5 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex items-center justify-between p-0 pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={runPing}
          disabled={ping.isPending}
          className="rounded-control h-8.5 px-3.5 text-xs shadow-xs"
        >
          <RefreshCwIcon className={`mr-1 size-3.5 ${ping.isPending ? "animate-spin" : ""}`} />
          {ping.isPending ? "Testing..." : "Test"}
        </Button>
        <Button size="sm" className="h-8.5 rounded-control shadow-xs px-4 text-xs font-medium" asChild>
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
    <span className="inline-flex h-6 items-center rounded-full border-0 bg-secondary px-2.5 text-xs font-medium text-muted-foreground">
      {label}
    </span>
  )
}

function RegistryMetaChip({ label, icon: Icon }: RegistryMetaChipProps) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-control border-0 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-foreground">
      {Icon ? <Icon className="size-3 text-muted-foreground" /> : null}
      <span>{label}</span>
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <p className="text-xs font-medium text-foreground">{value}</p>
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
