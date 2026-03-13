"use client"

import { SearchIcon, PlusIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface RepositorySearchProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onClear: () => void
  placeholder?: string
  disabled?: boolean
}

export function RepositorySearch({ 
  value, 
  onChange, 
  onClear, 
  placeholder = "Quick search by name or tag...",
  disabled = false 
}: RepositorySearchProps) {
  return (
    <div className="flex-1 relative group">
      <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-12 pl-11 bg-card border-border focus:border-primary rounded-2xl transition-all disabled:opacity-50"
        placeholder={placeholder}
        aria-label="Search repositories"
      />
      {value && !disabled && (
        <button
          onClick={onClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground p-1 transition-colors"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
    </div>
  )
}

interface RegistrySelectorProps {
  registries: RegistryConnection[]
  selectedRegistry: string
  onRegistryChange: (id: string) => void
  disabled?: boolean
}

export function RegistrySelector({ 
  registries, 
  selectedRegistry, 
  onRegistryChange,
  disabled = false 
}: RegistrySelectorProps) {
  return (
    <div className="flex overflow-x-auto pb-2 sm:pb-0 scrollbar-none gap-2 min-w-0">
      <div className="flex bg-muted p-1 rounded-2xl border border-border">
        {registries.map((registry) => {
          const isActive = selectedRegistry === registry.id
          return (
            <button
              key={registry.id}
              onClick={() => onRegistryChange(registry.id)}
              disabled={disabled}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 cursor-pointer",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Select ${registry.name} registry`}
              aria-pressed={isActive}
            >
              <div className={cn(
                "size-2 rounded-full",
                isActive ? "bg-white" : "bg-muted-foreground/30"
              )} />
              {registry.name}
            </button>
          )
        })}
        <Button
          variant="ghost"
          size="sm"
          className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary border border-dashed border-border ml-1 flex items-center gap-2"
        >
          <PlusIcon className="size-3.5" />
          <span>Connect</span>
        </Button>
      </div>
    </div>
  )
}

interface RepositoryLoadingProps {
  count?: number
}

export function RepositoryLoading({ count = 8 }: RepositoryLoadingProps) {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-muted" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted/60 rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="h-4 w-12 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-6 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface RepositoryErrorProps {
  onRetry: () => void
  message?: string
}

export function RepositoryError({ onRetry, message }: RepositoryErrorProps) {
  return (
    <div className="rounded-3xl border border-destructive bg-destructive/10 p-20 text-center animate-in fade-in duration-300">
      <div className="mx-auto w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangleIcon className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-destructive">Failed to Load Repositories</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        {message || "Unable to fetch repositories from the selected registry. Please try again or contact support if the problem persists."}
      </p>
      <Button onClick={onRetry} variant="outline" className="rounded-2xl">
        <RefreshCwIcon className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  )
}

interface RepositoryEmptyProps {
  hasSearch: boolean
  onConnectRegistry?: () => void
}

export function RepositoryEmpty({ hasSearch, onConnectRegistry }: RepositoryEmptyProps) {
  if (hasSearch) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-20 text-center animate-in fade-in duration-300">
        <p className="text-muted-foreground">No repositories found matching your search.</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-20 text-center backdrop-blur-sm animate-in fade-in duration-300">
      <div className="mx-auto w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
        <PlusIcon className="size-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">No Registry Connected</h3>
      <p className="text-muted-foreground max-w-xs mx-auto mb-8">
        Connect a Docker registry to start browsing your container images.
      </p>
      <Button size="lg" className="rounded-2xl px-8 shadow-xl shadow-primary/20" onClick={onConnectRegistry}>
        Add First Registry
      </Button>
    </div>
  )
}
