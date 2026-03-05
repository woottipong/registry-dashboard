"use client"

import { motion } from "framer-motion"
import { ServerIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
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
      <div className="group relative p-6 rounded-xl border border-border/50 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-muted rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-muted rounded-lg w-32" />
            <div className="h-4 bg-muted rounded w-48" />
            <div className="flex gap-4">
              <div className="h-4 bg-muted rounded w-16" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          </div>
          <div className="w-20 h-8 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className="group relative p-6 rounded-xl border border-border/50 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl pointer-events-none" />

      <div className="relative flex items-start gap-4">
        {/* Registry icon with status indicator */}
        <div className="relative">
          <div className="p-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm group-hover:border-primary/20 group-hover:bg-primary/5 transition-all duration-300">
            <ServerIcon className="w-6 h-6 text-primary" />
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
              {registry.provider}
            </span>
            {registry.isDefault && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                Default
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="truncate font-mono">{registry.url}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-muted-foreground">Repos:</span>
              <span className="font-medium text-foreground">{repoCount?.toLocaleString() ?? '...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-muted-foreground">Tags:</span>
              <span className="font-medium text-foreground">
                {tagCount !== undefined ? tagCount.toLocaleString() : '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <Link href={`/repos/${registry.id}`}>
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90",
                "transition-all duration-300 shadow-sm hover:shadow-md"
              )}
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Browse
            </motion.span>
          </Link>
        </div>
      </div>

      {/* Decorative accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full" />
    </motion.div>
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
      <div className="flex flex-col gap-4 p-6 min-h-[320px] flex items-center justify-center">
        <div className="text-center py-12">
          <ServerIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No registries connected</h3>
          <p className="text-sm text-muted-foreground">Connect your first registry to start monitoring</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-6 min-h-[320px]">
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
