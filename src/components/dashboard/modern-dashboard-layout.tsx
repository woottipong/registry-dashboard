"use client"

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
    <section className={cn("relative", className)}>
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

      <div className="relative">
        {children}
      </div>
    </section>
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
      "space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300",
      className
    )}>
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
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
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
    </header>
  )
}
