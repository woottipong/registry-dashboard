"use client"

import { SearchIcon, PlusIcon, AlertTriangleIcon, RefreshCwIcon, ServerIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

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
  return (
    <div className="flex-1 relative group max-w-md">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 pl-10 bg-card/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-lg transition-all disabled:opacity-50"
        placeholder={placeholder}
        aria-label="Search registries"
      />
      {value && !disabled && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  )
}

interface RegistryCardProps {
  registry: RegistryConnection
  status?: 'connected' | 'error' | 'checking'
  latencyMs?: number
  checkedAt?: string
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
  checkedAt,
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
      case 'connected': return 'text-emerald-600 bg-emerald-100 border-emerald-200'
      case 'error': return 'text-red-600 bg-red-100 border-red-200'
      case 'checking': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-neutral-600 bg-neutral-100 border-neutral-200'
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
    <div className="rounded-lg border bg-card p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{registry.name}</h3>
            {registry.isDefault && (
              <Badge variant="default" className="text-xs">Default</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{registry.url}</p>
          
          {/* Status indicator */}
          <div className={cn(
            "inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border",
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
        
        <ServerIcon className="size-8 text-muted-foreground" />
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
              rateLimitPercent > 80 ? "text-red-600" : 
              rateLimitPercent > 60 ? "text-yellow-600" : "text-green-600"
            )}>
              {rateLimitPercent.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                rateLimitPercent > 80 ? "bg-red-500" : 
                rateLimitPercent > 60 ? "bg-yellow-500" : "bg-green-500"
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
        >
          <RefreshCwIcon className={cn("size-4", isLoading && "animate-spin")} />
          Test
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={onSetDefault}>
          Set Default
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
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
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="size-8" />
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16 rounded" />
            <Skeleton className="h-8 w-12 rounded" />
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-16 rounded" />
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
      <div className="rounded-lg border border-dashed p-12 text-center">
        <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No registries found</h3>
        <p className="text-muted-foreground mb-4">
          No registries match "{searchQuery}". Try a different search term.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <ServerIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">No registries connected</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Connect your first container registry to start managing your Docker images.
      </p>
      <Button onClick={onAddRegistry} className="rounded-lg">
        <PlusIcon className="size-4 mr-2" />
        Add Registry
      </Button>
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
