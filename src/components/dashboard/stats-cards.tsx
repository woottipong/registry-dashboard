"use client"

import React from "react"
import { DatabaseIcon, HardDriveIcon, PackageIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBytes } from "@/lib/format"
import { cn } from "@/lib/utils"

interface StatsCardsProps {
  totalRegistries?: number
  totalRepositories?: number
  totalTags?: number
  totalSizeBytes?: number
  isLoadingRegistries?: boolean
  isLoadingRepos?: boolean
}

import { motion } from "framer-motion"

interface StatConfig {
  label: string
  icon: React.ComponentType<{ className?: string }>
  value: number | undefined
  isLoading: boolean
  format: (v: number) => string
  color: string
}

export function StatsCards({
  totalRegistries,
  totalRepositories,
  totalTags,
  totalSizeBytes,
  isLoadingRegistries,
  isLoadingRepos,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Registries",
      icon: DatabaseIcon,
      value: totalRegistries,
      isLoading: isLoadingRegistries ?? false,
      format: (v: number) => v.toString(),
    },
    {
      label: "Repositories",
      icon: PackageIcon,
      value: totalRepositories,
      isLoading: isLoadingRepos ?? false,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Total Tags",
      icon: TagIcon,
      value: totalTags,
      isLoading: isLoadingRepos ?? false,
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "Storage",
      icon: HardDriveIcon,
      value: totalSizeBytes,
      isLoading: isLoadingRepos ?? false,
      format: (v: number) => formatBytes(v),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 border border-border/50 rounded-[2rem] overflow-hidden backdrop-blur-sm">
      {stats.map(({ label, format, value, isLoading, icon: Icon }, index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card/30 p-8 flex flex-col gap-3 transition-colors hover:bg-card/50 group"
        >
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-md bg-primary/10 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Icon className="size-3" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em]">{label}</span>
          </div>

          <div className="flex items-baseline gap-1">
            {isLoading ? (
              <Skeleton className="h-9 w-20 rounded-lg bg-muted/40" />
            ) : (
              <>
                <span className="text-3xl font-semibold tracking-tight">
                  {value !== undefined ? format(value).split(' ')[0] : "0"}
                </span>
                <span className="text-sm font-medium text-muted-foreground/40">
                  {value !== undefined && format(value).split(' ').length > 1 ? format(value).split(' ')[1] : ""}
                </span>
              </>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
