"use client"

import { ServerIcon, ArrowRightIcon, BoxIcon } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RegistryConnection } from "@/types/registry"

interface ModernRegistryCardProps {
  registry: RegistryConnection
  repoCount?: number
  tagCount?: number
  isLoading?: boolean
}

export function ModernRegistryCard({
  registry,
  repoCount,
  tagCount,
  isLoading
}: ModernRegistryCardProps) {
  if (isLoading) {
    return (
      <div className="p-6 rounded-xl border border-border/50 bg-card">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-xl" />
          <div className="flex-1 flex flex-col gap-3">
            <Skeleton className="h-6 w-32 rounded-lg" />
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          <Skeleton className="w-20 h-8 rounded-lg" />
        </div>
      </div>
    )
  }

  const { Icon: ProviderIcon, bg: providerBg, iconColor: providerIconColor } =
    registry.provider === "dockerhub"
      ? { Icon: BoxIcon, bg: "bg-blue-500/10", iconColor: "text-blue-500" }
      : { Icon: ServerIcon, bg: "bg-muted", iconColor: "text-primary" }

  const providerLabel = registry.provider === "dockerhub" ? "Docker Hub" : "Generic"

  return (
    <div className="group relative p-6 rounded-xl border border-border/50 bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5">
      <div className="flex items-start gap-4">
        {/* Registry icon with status indicator */}
        <div className="relative">
          <div className={cn(
            "p-3 rounded-xl border border-border/50 backdrop-blur-sm transition-all duration-300 group-hover:border-primary/20",
            providerBg
          )}>
            <ProviderIcon className={cn("size-6", providerIconColor)} />
          </div>
          {registry.isDefault && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm" />
          )}
        </div>

        {/* Registry information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {registry.name}
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {providerLabel}
            </span>
            {registry.isDefault && (
              <Badge variant="outline" className="text-chart-3 border-chart-3/40 bg-chart-3/10 text-xs">
                Default
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="truncate font-mono">{registry.url}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-chart-5 rounded-full" />
              <span className="text-muted-foreground">Repos:</span>
              <span className="font-medium text-foreground">{repoCount?.toLocaleString() ?? "..."}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-chart-2 rounded-full" />
              <span className="text-muted-foreground">Tags:</span>
              <span className="font-medium text-foreground">
                {tagCount !== undefined ? tagCount.toLocaleString() : "..."}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <Button asChild size="sm" variant="outline">
            <Link href={`/repos?registry=${registry.id}`}>
              Browse
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ModernRegistryListProps {
  registries: RegistryConnection[]
  repoCounts?: Record<string, number>
  tagCounts?: Record<string, number>
  isLoading?: boolean
}

export function ModernRegistryList({
  registries,
  repoCounts = {},
  tagCounts = {},
  isLoading
}: ModernRegistryListProps) {
  if (!isLoading && registries.length === 0) {
    return (
      <div className="flex flex-col gap-4 min-h-[320px] items-center justify-center">
        <div className="text-center py-12">
          <ServerIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No registries connected</h3>
          <p className="text-sm text-muted-foreground">Connect your first registry to start monitoring</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 min-h-[320px]">
      {isLoading ? (
        // Loading skeletons
        Array.from({ length: 3 }).map((_, index) => (
          <ModernRegistryCard
            key={`skeleton-${index}`}
            registry={{
              id: `skeleton-${index}`,
              name: "Loading...",
              url: "",
              provider: "generic" as const,
              authType: "none" as const,
              createdAt: new Date().toISOString(),
            }}
            isLoading={true}
          />
        ))
      ) : (
        // Actual registry cards
        registries.map((registry) => (
          <ModernRegistryCard
            key={registry.id}
            registry={registry}
            repoCount={repoCounts[registry.id]}
            tagCount={tagCounts[registry.id]}
          />
        ))
      )}
    </div>
  )
}
