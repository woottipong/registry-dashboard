"use client"

import React from "react"
import { DatabaseIcon, HardDriveIcon, PackageIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBytes } from "@/lib/format"

interface StatsCardsProps {
  totalRegistries?: number
  totalRepositories?: number
  totalTags?: number
  totalSizeBytes?: number
  isLoadingRegistries?: boolean
  isLoadingRepos?: boolean
}

interface StatConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: number | undefined
  isLoading: boolean
  format: (v: number) => string
}

export function StatsCards({
  totalRegistries,
  totalRepositories,
  totalTags,
  totalSizeBytes,
  isLoadingRegistries,
  isLoadingRepos,
}: StatsCardsProps) {
  const stats: StatConfig[] = [
    {
      label: "Registries",
      icon: DatabaseIcon,
      value: totalRegistries,
      isLoading: isLoadingRegistries ?? false,
      format: (v) => v.toString(),
    },
    {
      label: "Repositories",
      icon: PackageIcon,
      value: totalRepositories,
      isLoading: isLoadingRepos ?? false,
      format: (v) => v.toLocaleString(),
    },
    {
      label: "Tags",
      icon: TagIcon,
      value: totalTags,
      isLoading: isLoadingRepos ?? false,
      format: (v) => v.toLocaleString(),
    },
    {
      label: "Storage",
      icon: HardDriveIcon,
      value: totalSizeBytes,
      isLoading: isLoadingRepos ?? false,
      format: (v) => formatBytes(v),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(({ label, format, value, isLoading }) => (
        <div
          key={label}
          className="flex flex-col border border-border rounded-md p-4 bg-card"
        >
          <span className="text-xs font-medium text-muted-foreground mb-1">{label}</span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl font-bold tracking-tight">
              {value !== undefined ? format(value) : "0"}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
