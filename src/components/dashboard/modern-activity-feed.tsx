"use client"

import { motion } from "framer-motion"
import { 
  ActivityIcon, 
  DownloadIcon, 
  TrashIcon, 
  PlusIcon,
  UploadIcon
} from "lucide-react"
import { DASHBOARD_DESIGN } from "@/lib/design/dashboard-design"
import { cn } from "@/lib/utils"
import type { ActivityItem } from "@/contexts/activity-context"

interface ModernActivityItemProps {
  activity: ActivityItem
  delay?: number
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'push':
      return UploadIcon
    case 'pull':
      return DownloadIcon
    case 'delete':
      return TrashIcon
    case 'create':
      return PlusIcon
    default:
      return ActivityIcon
  }
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
      return 'text-primary-600 bg-primary-100'
    default:
      return 'text-neutral-600 bg-neutral-100'
  }
}

export function ModernActivityItem({ activity, delay = 0 }: ModernActivityItemProps) {
  const Icon = getActivityIcon(activity.type)
  const iconColor = getActivityColor(activity.type)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: parseFloat(DASHBOARD_DESIGN.motion.duration.normal) / 1000,
        ease: [0.16, 1, 0.3, 1] as const,
        delay: delay / 1000
      }}
      className={cn(DASHBOARD_DESIGN.components.activity.item)}
    >
      {/* Activity icon */}
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        iconColor
      )}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Activity content */}
      <div className={DASHBOARD_DESIGN.components.activity.content}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-neutral-900">
            {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
          </span>
          <span className="text-xs text-neutral-500">
            {activity.repository}
          </span>
        </div>
        
        {activity.tag && (
          <p className="text-xs text-neutral-600 mb-2">
            Tag: {activity.tag}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-neutral-500">
          <span className="font-mono">
            {activity.registry}
          </span>
          <span className={cn(DASHBOARD_DESIGN.components.activity.timestamp)}>
            {activity.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

interface ModernActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
  maxItems?: number
}

export function ModernActivityFeed({ 
  activities, 
  isLoading, 
  maxItems = 10 
}: ModernActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems)

  if (isLoading) {
    return (
      <div className={DASHBOARD_DESIGN.components.activity.container}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-neutral-100/50 animate-pulse"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-8 h-8 bg-neutral-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-neutral-200 rounded w-32" />
              <div className="h-3 bg-neutral-200 rounded w-48" />
              <div className="h-3 bg-neutral-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className={cn(
        DASHBOARD_DESIGN.components.activity.container,
        "flex items-center justify-center"
      )}>
        <div className="text-center py-8">
          <ActivityIcon className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
          <p className="text-sm text-neutral-600">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className={DASHBOARD_DESIGN.components.activity.container}>
      {displayActivities.map((activity, index) => (
        <ModernActivityItem
          key={`${activity.id}-${activity.timestamp}`}
          activity={activity}
          delay={index * 50}
        />
      ))}
      
      {activities.length > maxItems && (
        <div className="text-center pt-2">
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
            View all {activities.length} activities
          </button>
        </div>
      )}
    </div>
  )
}
