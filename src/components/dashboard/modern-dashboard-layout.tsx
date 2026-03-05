"use client"

import { motion } from "framer-motion"
import { 
  DatabaseIcon, 
  ActivityIcon, 
  ServerIcon, 
  TrendingUpIcon 
} from "lucide-react"
import { DASHBOARD_DESIGN } from "@/lib/design/dashboard-design"
import { cn } from "@/lib/utils"

interface ModernDashboardSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function ModernDashboardSection({ 
  title, 
  description, 
  children, 
  className,
  icon: Icon 
}: ModernDashboardSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.normal) / 1000,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className={cn(
        "relative",
        className
      )}
    >
      {/* Section header */}
      {(title || description) && (
        <div className="flex items-center gap-3 mb-6">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary-100/50 border border-primary-200/50">
              <Icon className="w-5 h-5 text-primary-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
            {description && (
              <p className="text-sm text-neutral-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      )}

      {/* Section content */}
      <div className="relative">
        {children}
      </div>
    </motion.section>
  )
}

interface ModernDashboardGridProps {
  children: React.ReactNode
  className?: string
}

export function ModernDashboardGrid({ children, className }: ModernDashboardGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 lg:grid-cols-2 gap-6",
      className
    )}>
      {children}
    </div>
  )
}

interface ModernDashboardContainerProps {
  children: React.ReactNode
  className?: string
}

export function ModernDashboardContainer({ children, className }: ModernDashboardContainerProps) {
  return (
    <div className={cn(
      "space-y-8 max-w-7xl mx-auto px-6 py-8",
      className
    )}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      {children}
    </div>
  )
}

interface ModernDashboardHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function ModernDashboardHeader({ title, description, actions }: ModernDashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.fast) / 1000,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-neutral-900 bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">
          {title}
        </h1>
        {description && (
          <p className="text-neutral-600">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.header>
  )
}
