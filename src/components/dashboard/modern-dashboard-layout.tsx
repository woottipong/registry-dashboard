"use client"

import { motion } from "framer-motion"
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
        duration: 0.3,
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
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-accent/5 to-transparent rounded-full blur-3xl" />
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
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1] as const
      }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
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
