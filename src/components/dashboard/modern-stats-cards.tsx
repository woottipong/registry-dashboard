"use client"

import { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  isLoading?: boolean
  className?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isLoading,
  className,
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="w-20 h-3" />
        </div>
        <Skeleton className="w-20 h-7 rounded-lg" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/50",
        "bg-card px-5 py-4",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </div>
        </div>

        {trend && (
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-medium",
              trend.isPositive
                ? "text-chart-2 border-chart-2/40 bg-chart-2/10"
                : "text-destructive border-destructive/40 bg-destructive/10"
            )}
          >
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </Badge>
        )}
      </div>

      <div className="text-2xl font-bold font-mono text-foreground mt-3">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  )
}

interface StatsGridProps {
  stats: Array<{
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
      value: number
      isPositive: boolean
    }
  }>
  isLoading?: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          {...stat}
          isLoading={isLoading}
        />
      ))}
    </div>
  )
}
