"use client"

import { motion } from "framer-motion"
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
  delay?: number
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isLoading,
  className,
  delay = 0
}: StatCardProps) {
  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-5 h-5 bg-muted rounded-lg" />
          <div className="w-16 h-4 bg-muted rounded" />
        </div>
        <div className="w-24 h-8 bg-muted rounded-lg mb-2" />
        <div className="w-20 h-3 bg-muted rounded" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: delay / 1000
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50",
        "bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm p-6",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300",
        className
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl pointer-events-none" />

      <div className="relative flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>

        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend.isPositive
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="text-3xl font-bold font-mono text-foreground">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mt-1">
          {title}
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl pointer-events-none" />
    </motion.div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          {...stat}
          isLoading={isLoading}
          delay={index * 100}
        />
      ))}
    </div>
  )
}
