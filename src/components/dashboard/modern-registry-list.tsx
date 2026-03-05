"use client"

import { motion } from "framer-motion"
import { ServerIcon, ExternalLinkIcon } from "lucide-react"
import { DASHBOARD_DESIGN } from "@/lib/design/dashboard-design"
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
      <div className={cn(
        DASHBOARD_DESIGN.components.registry.item,
        "animate-pulse"
      )}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-neutral-200 rounded-lg w-32" />
            <div className="h-4 bg-neutral-200 rounded w-48" />
            <div className="flex gap-4">
              <div className="h-4 bg-neutral-200 rounded w-16" />
              <div className="h-4 bg-neutral-200 rounded w-16" />
            </div>
          </div>
          <div className="w-20 h-8 bg-neutral-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.normal) / 1000,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className={cn(
        DASHBOARD_DESIGN.components.registry.item,
        DASHBOARD_DESIGN.components.registry.itemHover
      )}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-accent-500/5 rounded-xl" />
      
      <div className="relative flex items-start gap-4">
        {/* Registry icon with status indicator */}
        <div className="relative">
          <div className={cn(
            "p-3 rounded-xl border border-neutral-200/50 bg-white/80 backdrop-blur-sm",
            "group-hover:border-primary-300/50 group-hover:bg-primary-50/50 transition-all duration-normal"
          )}>
            <ServerIcon className="w-6 h-6 text-primary-600" />
          </div>
          {registry.isDefault && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>

        {/* Registry information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={cn(DASHBOARD_DESIGN.components.registry.name)}>
              {registry.name}
            </h3>
            <span className={cn(DASHBOARD_DESIGN.components.registry.badge)}>
              {registry.provider}
            </span>
            {registry.isDefault && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                Default
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
            <span className="truncate font-mono">{registry.url}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">{repoCount ?? 0}</span>
              <span className="text-neutral-500">Repositories</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-900">{tagCount ?? 0}</span>
              <span className="text-neutral-500">Tags</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
              "bg-primary-600 text-white border border-primary-700",
              "hover:bg-primary-700 hover:border-primary-800",
              "transition-all duration-normal shadow-sm hover:shadow-md"
            )}
          >
            <ExternalLinkIcon className="w-4 h-4" />
            Browse
          </motion.button>
        </div>
      </div>

      {/* Decorative accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 via-accent-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-normal rounded-r-full" />
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
      <div className={cn(
        DASHBOARD_DESIGN.components.registry.container,
        "flex items-center justify-center"
      )}>
        <div className="text-center py-12">
          <ServerIcon className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No registries connected</h3>
          <p className="text-sm text-neutral-600">Connect your first registry to start monitoring</p>
        </div>
      </div>
    )
  }

  return (
    <div className={DASHBOARD_DESIGN.components.registry.container}>
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
        registries.map((registry, index) => (
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
