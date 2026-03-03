"use client"

import { DatabaseIcon, HardDriveIcon, PackageIcon, TagIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBytes } from "@/lib/format"

interface StatsData {
  totalRegistries: number
  totalRepositories: number
  totalTags: number
  totalSizeBytes: number
}

interface StatsCardsProps {
  data?: StatsData
  isLoading?: boolean
}

const STATS = [
  {
    key: "totalRegistries" as const,
    label: "Registries",
    icon: DatabaseIcon,
    format: (v: number) => v.toString(),
  },
  {
    key: "totalRepositories" as const,
    label: "Repositories",
    icon: PackageIcon,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalTags" as const,
    label: "Tags",
    icon: TagIcon,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "totalSizeBytes" as const,
    label: "Storage",
    icon: HardDriveIcon,
    format: (v: number) => formatBytes(v),
  },
]

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS.map(({ key, label, format }) => (
        <div
          key={key}
          className="flex flex-col border border-border rounded-md p-4 bg-card"
        >
          <span className="text-xs font-medium text-muted-foreground mb-1">{label}</span>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <span className="text-2xl font-bold tracking-tight">
              {data ? format(data[key]) : "0"}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
