"use client"

import React from "react"
import { DatabaseIcon, HardDriveIcon, PackageIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBytes } from "@/lib/format"
import { useMounted } from "@/hooks/use-mounted"

interface StatsCardsProps {
  totalRegistries?: number
  totalRepositories?: number
  totalTags?: number
  totalSizeBytes?: number
  isLoadingRegistries?: boolean
  isLoadingRepos?: boolean
}

export function StatsCards({
  totalRegistries,
  totalRepositories,
  totalTags,
  totalSizeBytes,
  isLoadingRegistries,
  isLoadingRepos,
}: StatsCardsProps) {
  const isMounted = useMounted()

  const stats = [
    {
      label: "Registries",
      icon: DatabaseIcon,
      value: totalRegistries,
      isLoading: isMounted && (isLoadingRegistries ?? false) && totalRegistries === undefined,
      format: (v: number) => v.toString(),
    },
    {
      label: "Repositories",
      icon: PackageIcon,
      value: totalRepositories,
      isLoading: isMounted && (isLoadingRepos ?? false) && totalRepositories === undefined,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Total Tags",
      icon: TagIcon,
      value: totalTags,
      isLoading: isMounted && (isLoadingRepos ?? false) && totalTags === undefined,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Storage",
      icon: HardDriveIcon,
      value: totalSizeBytes,
      isLoading: isMounted && (isLoadingRepos ?? false) && totalSizeBytes === undefined,
      format: (v: number) => formatBytes(v),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/50 rounded-[2rem] overflow-hidden backdrop-blur-sm relative shadow-sm">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-chart-2/5 blur-xl pointer-events-none" />

      {stats.map(({ label, format, value, isLoading, icon: Icon }) => (
        <div
          key={label}
          className="bg-card/40 p-8 flex flex-col gap-3 transition-all duration-300 hover:bg-card/80 hover:shadow-lg hover:-translate-y-0.5 group relative z-10 animate-in fade-in zoom-in-95 duration-500"
        >
          {/* Subtle accent line on hover */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="flex items-center gap-2">
            <div className="size-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:from-primary group-hover:to-primary/80 group-hover:text-white">
              <Icon className="size-3.5" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">{label}</span>
          </div>

          <div className="flex items-baseline gap-1 mt-1">
            {isLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg bg-muted/40" />
            ) : (
              <>
                <span className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                  {value !== undefined ? format(value).split(' ')[0] : "0"}
                </span>
                <span className="text-sm font-semibold text-muted-foreground/50">
                  {value !== undefined && format(value).split(' ').length > 1 ? format(value).split(' ')[1] : ""}
                </span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
