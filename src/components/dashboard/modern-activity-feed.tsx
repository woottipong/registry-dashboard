"use client"

import {
  ActivityIcon,
  DownloadIcon,
  TrashIcon,
  PlusIcon,
  UploadIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { ActivityItem } from "@/contexts/activity-context"

interface ModernActivityItemProps {
  activity: ActivityItem
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
      return 'text-chart-2 bg-chart-2/10'
    case 'pull':
      return 'text-chart-5 bg-chart-5/10'
    case 'delete':
      return 'text-destructive bg-destructive/10'
    case 'create':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-muted/50'
  }
}

export function ModernActivityItem({ activity }: ModernActivityItemProps) {
  const iconColor = getActivityColor(activity.type)
  const IconComponent = ActivityIcons[activity.type as keyof typeof ActivityIcons] || ActivityIcons.default

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors">
      {/* Activity icon */}
      <div className={cn(
        "p-2 rounded-lg flex-shrink-0",
        iconColor
      )}>
        <IconComponent className="size-4" />
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
    </div>
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
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-start gap-3 p-3 rounded-lg border border-border"
          >
            <Skeleton className="size-8 rounded-lg shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto items-center justify-center">
        <div className="text-center py-8">
          <ActivityIcon className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
      {displayActivities.map((activity, index) => (
        <ModernActivityItem
          key={`${activity.id}-${activity.timestamp}`}
          activity={activity}
        />
      ))}

      {activities.length > maxItems && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View all {activities.length} activities
          </Button>
        </div>
      )}
    </div>
  )
}
