"use client"

import { DatabaseIcon, HardDriveIcon, PackageIcon, TagIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
    label: "Total Size",
    icon: HardDriveIcon,
    format: (v: number) => formatBytes(v),
  },
]

export function StatsCards({ data, isLoading }: StatsCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map(({ key, label, icon: Icon, format }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              {isLoading ? (
                <Skeleton className="mt-1 h-6 w-16" />
              ) : (
                <p className="text-2xl font-semibold tabular-nums">
                  {data ? format(data[key]) : "—"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
