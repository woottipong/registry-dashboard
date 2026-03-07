"use client"

import { LucideIcon } from "lucide-react"
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
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card px-5 py-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-muted rounded-lg" />
          <div className="w-20 h-3 bg-muted rounded" />
        </div>
        <div className="w-20 h-7 bg-muted rounded-lg" />
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
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </div>
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            trend.isPositive
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
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
