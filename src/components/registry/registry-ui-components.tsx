"use client"

import Link from "next/link"
import {
  PlusIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ServerIcon,
  BoxIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
  ArrowRightIcon,
  LockIcon,
  KeyRoundIcon,
  LockOpenIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

// ─── Registry Card ────────────────────────────────────────────────────────────

interface RegistryCardProps {
  registry: RegistryConnection
  status?: "connected" | "error" | "checking"
  latencyMs?: number
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  onPing?: () => void
  isLoading?: boolean
}

export function ModernRegistryCard({
  registry,
  status = "checking",
  latencyMs,
  onEdit,
  onDelete,
  onSetDefault,
  onPing,
  isLoading = false,
}: RegistryCardProps) {
  // rateLimitPercent = remaining / limit * 100 (% remaining, not % used)
  const rateLimitPercent =
    registry.rateLimit?.limit && registry.rateLimit.remaining !== null
      ? Math.max(
        0,
        Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100)
      )
      : null

  const statusConfig =
    status === "checking"
      ? null
      : ({
        connected: {
          icon: (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex size-full rounded-full bg-chart-2 opacity-60 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-chart-2" />
            </span>
          ),
          label: "Connected",
          className: "text-chart-2 bg-chart-2/10 border-chart-2/30",
        },
        error: {
          icon: <AlertCircleIcon className="size-3.5 shrink-0" />,
          label: "Unreachable",
          className: "text-destructive bg-destructive/10 border-destructive/30",
        },
      } as const)[status as "connected" | "error"] ?? null

  const providerVisual = registry.provider === "dockerhub"
    ? { Icon: BoxIcon, bg: "bg-blue-500/10", iconColor: "text-blue-500" }
    : { Icon: ServerIcon, bg: "bg-muted", iconColor: "text-muted-foreground" }

  const authVisual = {
    none: { Icon: LockOpenIcon, label: "Anonymous", className: "text-muted-foreground" },
    basic: { Icon: LockIcon, label: "Basic Auth", className: "text-chart-2" },
    bearer: { Icon: KeyRoundIcon, label: "Token", className: "text-chart-2" },
  }[registry.authType] ?? { Icon: LockOpenIcon, label: "Anonymous", className: "text-muted-foreground" }

  const browseHref = `/repos?registry=${registry.id}`

  return (
    <Card className="group flex flex-col transition-all duration-200 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-start gap-3 pb-3">
        {/* Provider avatar */}
        <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg mt-0.5", providerVisual.bg)}>
          <providerVisual.Icon className={cn("size-4", providerVisual.iconColor)} />
        </div>

        {/* Name + URL */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CardTitle className="text-sm font-semibold truncate">
              {registry.name}
            </CardTitle>
            {registry.isDefault && (
              <Badge variant="default" className="text-xs shrink-0">
                Default
              </Badge>
            )}
          </div>
          <CardDescription className="truncate text-xs mt-0.5">{registry.url}</CardDescription>
        </div>

        {/* Actions Dropdown — partial opacity on mobile so it's always reachable */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Registry actions"
            >
              <MoreHorizontalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onPing} disabled={isLoading}>
              <RefreshCwIcon data-icon="inline-start" />
              Test connection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSetDefault} disabled={registry.isDefault}>
              <StarIcon data-icon="inline-start" />
              Set as default
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon data-icon="inline-start" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 flex-1">
        {/* Status + Auth row */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusConfig && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
                statusConfig.className
              )}
            >
              {statusConfig.icon}
              {statusConfig.label}
              {latencyMs && (
                <span className="text-muted-foreground">· {latencyMs}ms</span>
              )}
            </span>
          )}
          <span className={cn("inline-flex items-center gap-1 text-xs", authVisual.className)}>
            <authVisual.Icon className="size-3 shrink-0" />
            {authVisual.label}
          </span>
        </div>

        {/* API quota remaining bar */}
        {typeof rateLimitPercent === "number" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">API quota remaining</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  rateLimitPercent < 20
                    ? "text-destructive"
                    : rateLimitPercent < 40
                      ? "text-chart-3"
                      : "text-chart-2"
                )}
              >
                {rateLimitPercent.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  rateLimitPercent < 20
                    ? "bg-destructive"
                    : rateLimitPercent < 40
                      ? "bg-chart-3"
                      : "bg-chart-2"
                )}
                style={{ width: `${rateLimitPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <Button asChild className="w-full" size="sm" variant="outline">
          <Link href={browseHref}>
            Browse repositories
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

interface RegistryLoadingProps {
  count?: number
}

export function RegistryLoading({ count = 4 }: RegistryLoadingProps) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="size-8 rounded-md shrink-0" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Skeleton className="h-8 w-full rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface RegistryEmptyProps {
  onAddRegistry?: () => void
}

export function RegistryEmpty({ onAddRegistry }: RegistryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30 px-8 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <ServerIcon className="size-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No registries yet</h3>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        Connect a container registry to start browsing images, managing tags, and monitoring performance.
      </p>
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onAddRegistry} size="lg">
          <PlusIcon data-icon="inline-start" />
          Add your first registry
        </Button>
        <p className="text-xs text-muted-foreground">
          Supports Docker Hub, ECR, GCR, and any Registry V2 endpoint
        </p>
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

interface RegistryErrorProps {
  onRetry?: () => void
  message?: string
}

export function RegistryError({ onRetry, message }: RegistryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 px-8 py-16 text-center">
      <AlertTriangleIcon className="size-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to load registries</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {message ?? "Unable to fetch your registries. Please try again."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCwIcon data-icon="inline-start" />
        Try again
      </Button>
    </div>
  )
}

// ─── Summary Strip ────────────────────────────────────────────────────────────

interface RegistrySummaryProps {
  total: number
  defaultRegistry?: RegistryConnection
}

export function RegistrySummary({ total, defaultRegistry }: RegistrySummaryProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span>
        <span className="font-semibold text-foreground tabular-nums">{total}</span>{" "}
        {total === 1 ? "registry" : "registries"} connected
      </span>
      {defaultRegistry && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <span>
            Default:{" "}
            <span className="font-medium text-foreground">{defaultRegistry.name}</span>
          </span>
        </>
      )}
    </div>
  )
}

