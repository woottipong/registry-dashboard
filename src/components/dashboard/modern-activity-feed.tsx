"use client"

import { motion } from "framer-motion"
import {
  ActivityIcon,
  DownloadIcon,
  TrashIcon,
  PlusIcon,
  UploadIcon
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityItem } from "@/contexts/activity-context"

interface ModernActivityItemProps {
  activity: ActivityItem
  delay?: number
}

interface ModernActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  maxItems?: number
}

// Icon mapping object - defined outside render
const ActivityIcons = {
  push: UploadIcon,
  pull: DownloadIcon,
  delete: TrashIcon,
  create: PlusIcon,
  default: ActivityIcon,
}

function getActivityColor(type: string) {
  switch (type) {
    case 'push':
      return 'text-emerald-600 bg-emerald-100'
    case 'pull':
      return 'text-blue-600 bg-blue-100'
    case 'delete':
      return 'text-red-600 bg-red-100'
    case 'create':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

export function ModernActivityItem({ activity, delay = 0 }: ModernActivityItemProps) {
  const iconColor = getActivityColor(activity.type)
  const IconComponent = ActivityIcons[activity.type as keyof typeof ActivityIcons] || ActivityIcons.default

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: delay / 1000
      }}
      className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
    >
      {/* Activity icon */}
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        iconColor
      )}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Activity content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-foreground">
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            {activity.repository}
          </span>
        </div>

        {activity.tag && (
          <p className="text-xs text-muted-foreground mb-2">
            Tag: {activity.tag}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
          <span className="font-mono">
            {activity.registry}
          </span>
          <span className="font-mono">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function ModernActivityFeed({
  activities,
  isLoading,
  maxItems = 10
}: ModernActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4 max-h-96 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/50 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-8 h-8 bg-muted rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32" />
              <div className="h-3 bg-muted rounded w-48" />
              <div className="h-3 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className="flex flex-col gap-3 p-4 max-h-96 overflow-y-auto flex items-center justify-center">
        <div className="text-center py-8">
          <ActivityIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4 max-h-96 overflow-y-auto">
      {displayActivities.map((activity, index) => (
        <ModernActivityItem
          key={`${activity.id}-${activity.timestamp}`}
          activity={activity}
          delay={index * 50}
        />
      ))}

      {activities.length > maxItems && (
        <div className="text-center pt-2">
          <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  )
}
