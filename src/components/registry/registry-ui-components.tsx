"use client"

import { SearchIcon, PlusIcon, AlertTriangleIcon, RefreshCwIcon, ServerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"
import { useRef } from "react"

interface RegistrySearchProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export function RegistrySearch({
  value,
  onChange,
  onClear,
  placeholder = "Search registries...",
  disabled = false
}: RegistrySearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative group w-full max-w-sm">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
        <Input
          ref={inputRef}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="h-12 pl-12 pr-12 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm hover:shadow-md focus:shadow-lg"
          placeholder={placeholder}
          aria-label="Search registries"
          onKeyDown={(e) => {
            if (e.key === 'Escape' && value) {
              onClear()
              inputRef.current?.blur()
            }
          }}
        />
        {value && !disabled && (
          <button
            onClick={() => {
              onClear()
              inputRef.current?.focus()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-all duration-200 hover:scale-110"
            aria-label="Clear search"
          >
            <span className="text-sm font-bold">×</span>
          </button>
        )}
      </div>

      {/* Search suggestions hint */}
      {!value && !disabled && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-popover border rounded-lg p-3 shadow-lg opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 pointer-events-none">
          <p className="text-xs text-muted-foreground mb-2">Search by:</p>
          <div className="flex flex-wrap gap-1 text-xs">
            <span className="px-2 py-1 bg-muted rounded-md">Registry name</span>
            <span className="px-2 py-1 bg-muted rounded-md">Provider</span>
            <span className="px-2 py-1 bg-muted rounded-md">URL</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface RegistryCardProps {
  registry: RegistryConnection
  status?: 'connected' | 'error' | 'checking'
  latencyMs?: number
  onEdit?: () => void
  onDelete?: () => void
  onSetDefault?: () => void
  onPing?: () => void
  isLoading?: boolean
}

export function ModernRegistryCard({
  registry,
  status = 'checking',
  latencyMs,
  onEdit,
  onDelete,
  onSetDefault,
  onPing,
  isLoading = false
}: RegistryCardProps) {
  const rateLimitPercent = registry.rateLimit?.limit && registry.rateLimit.remaining !== null
    ? Math.max(0, Math.min(100, (registry.rateLimit.remaining / registry.rateLimit.limit) * 100))
    : null

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-chart-2 bg-chart-2/10 border-chart-2/20'
      case 'error': return 'text-destructive bg-destructive/10 border-destructive/20'
      case 'checking': return 'text-primary bg-primary/10 border-primary/20'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '✓'
      case 'error': return '✗'
      case 'checking': return '⟳'
      default: return '?'
    }
  }

  return (
    <div className="group rounded-xl border bg-card p-6 space-y-4 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-200">{registry.name}</h3>
            {registry.isDefault && (
              <Badge variant="default" className="text-xs animate-pulse">Default</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 group-hover:text-foreground/80 transition-colors duration-200">{registry.url}</p>

          {/* Status indicator */}
          <div className={cn(
            "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border transition-all duration-200 group-hover:scale-105",
            getStatusColor()
          )}>
            <span>{getStatusIcon()}</span>
            <span className="capitalize">{status}</span>
            {latencyMs && (
              <span className="text-muted-foreground">
                ({latencyMs}ms)
              </span>
            )}
          </div>
        </div>

        <ServerIcon className="size-8 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
      </div>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          {registry.provider}
        </Badge>
        {registry.capabilities?.canDelete && (
          <Badge variant="outline" className="text-xs">Can Delete</Badge>
        )}
        {registry.capabilities?.canSearch && (
          <Badge variant="outline" className="text-xs">Search</Badge>
        )}
        {registry.capabilities?.hasRateLimit && (
          <Badge variant="outline" className="text-xs">Rate Limited</Badge>
        )}
      </div>

      {/* Rate Limit */}
      {typeof rateLimitPercent === 'number' && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Rate Limit Usage</span>
            <span className={cn(
              "font-medium",
              rateLimitPercent > 80 ? "text-destructive" :
                rateLimitPercent > 60 ? "text-chart-3" : "text-chart-2"
            )}>
              {rateLimitPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300 rounded-full",
                rateLimitPercent > 80 ? "bg-destructive" :
                  rateLimitPercent > 60 ? "bg-chart-3" : "bg-chart-2"
              )}
              style={{ width: `${rateLimitPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPing}
          disabled={isLoading}
          className="rounded-lg hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
          title="Test registry connectivity"
        >
          <RefreshCwIcon className={cn("size-4", isLoading && "motion-safe:animate-spin")} />
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="rounded-lg hover:bg-blue-500/5 hover:border-blue-500/30 hover:text-blue-600 transition-all duration-200"
          title="Edit registry configuration"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onSetDefault}
          className="rounded-lg hover:bg-chart-2/5 hover:border-chart-2/30 hover:text-chart-2 transition-all duration-200"
          title="Set as default registry"
        >
          Set Default
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
          title="Remove this registry"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

interface RegistryLoadingProps {
  count?: number
}

export function RegistryLoading({ count = 4 }: RegistryLoadingProps) {
  return (
    <div className="grid gap-6 grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card p-6 space-y-4 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="size-8 rounded-lg" />
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="h-9 w-14 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

interface RegistryEmptyProps {
  onAddRegistry?: () => void
  searchQuery?: string
}

export function RegistryEmpty({ onAddRegistry, searchQuery }: RegistryEmptyProps) {
  if (searchQuery) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-16 text-center bg-gradient-to-br from-muted/20 to-muted/5">
        <div className="animate-pulse">
          <SearchIcon className="mx-auto h-16 w-16 text-muted-foreground/60 mb-6" />
        </div>
        <h3 className="text-xl font-semibold mb-3 text-muted-foreground">No registries found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
          We couldn&apos;t find any registries matching <span className="font-medium text-foreground bg-muted px-2 py-1 rounded-md">&quot;{searchQuery}&quot;</span>.
          Try adjusting your search terms or <button
            onClick={onAddRegistry}
            className="text-primary hover:underline font-medium transition-colors"
          >add a new registry</button>.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-16 text-center bg-gradient-to-br from-primary/5 via-muted/10 to-chart-2/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
      <div className="relative z-10">
        <div className="animate-bounce mb-6">
          <ServerIcon className="mx-auto h-16 w-16 text-primary/60" />
        </div>
        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
          Welcome to Registry Management
        </h3>
        <p className="text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed text-lg">
          Connect your first container registry to start managing Docker images, monitoring performance,
          and ensuring reliable deployments across your infrastructure.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button onClick={onAddRegistry} size="lg" className="rounded-xl px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <PlusIcon className="size-5 mr-2" />
            Add Your First Registry
          </Button>
          <p className="text-sm text-muted-foreground">
            Supports Docker Hub, ECR, GCR, and more
          </p>
        </div>
      </div>
    </div>
  )
}

interface RegistryErrorProps {
  onRetry?: () => void
  message?: string
}

export function RegistryError({ onRetry, message }: RegistryErrorProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-12 text-center">
      <AlertTriangleIcon className="mx-auto h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-medium mb-2 text-destructive">Failed to load registries</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        {message || "Unable to fetch your registries. Please try again."}
      </p>
      <Button onClick={onRetry} variant="outline" className="rounded-lg">
        <RefreshCwIcon className="size-4 mr-2" />
        Try Again
      </Button>
    </div>
  )
}
