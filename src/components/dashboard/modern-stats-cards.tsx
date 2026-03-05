"use client"

import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { DASHBOARD_DESIGN } from "@/lib/design/dashboard-design"
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
      <div className={cn(
        DASHBOARD_DESIGN.components.stats.card,
        "animate-pulse"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-5 h-5 bg-neutral-200 rounded-lg" />
          <div className="w-16 h-4 bg-neutral-200 rounded" />
        </div>
        <div className="w-24 h-8 bg-neutral-200 rounded-lg mb-2" />
        <div className="w-20 h-3 bg-neutral-200 rounded" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.normal) / 1000,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: delay / 1000
      }}
      className={cn(
        DASHBOARD_DESIGN.components.stats.card,
        DASHBOARD_DESIGN.components.stats.cardHover,
        className
      )}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent rounded-2xl" />
      
      <div className="relative flex items-start justify-between mb-4">
        <div className={cn(
          "p-2 rounded-lg bg-primary-100/50",
          "group-hover:bg-primary-200/50 transition-colors duration-normal"
        )}>
          <Icon className={cn(DASHBOARD_DESIGN.components.stats.icon)} />
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            trend.isPositive 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-red-100 text-red-700"
          )}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className={cn(DASHBOARD_DESIGN.components.stats.value)}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className={cn(DASHBOARD_DESIGN.components.stats.label)}>
          {title}
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-xl" />
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
    <div className={DASHBOARD_DESIGN.components.stats.container}>
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
