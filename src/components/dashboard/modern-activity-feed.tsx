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
      return 'text-[#0071E3] bg-[#0071E3]/10'
    case 'delete':
      return 'text-destructive bg-destructive/10'
    case 'create':
      return 'text-primary bg-primary/10'
    default:
      return 'text-muted-foreground bg-secondary'
  }
}

export function ModernActivityItem({ activity }: ModernActivityItemProps) {
  const iconColor = getActivityColor(activity.type)
  const IconComponent = ActivityIcons[activity.type as keyof typeof ActivityIcons] || ActivityIcons.default

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-secondary/35 p-3.5 transition-colors hover:bg-secondary/60">
      {/* Activity icon */}
      <div className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full",
        iconColor
      )}>
        <IconComponent className="size-4" />
      </div>

      {/* Activity content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold capitalize text-foreground">
            {activity.type}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {activity.repository}
          </span>
        </div>

        {activity.tag && (
          <p className="mb-1.5 text-xs text-muted-foreground font-mono">
            Tag: {activity.tag}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">
            {activity.registry}
          </span>
          <span>·</span>
          <span className="font-mono">
            {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-3.5"
          >
            <Skeleton className="size-8 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <Skeleton className="h-3 w-48 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayActivities.length === 0) {
    return (
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto items-center justify-center py-8">
        <ActivityIcon className="size-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No recent activity recorded</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
      {displayActivities.map((activity) => (
        <ModernActivityItem
          key={`${activity.id}-${activity.timestamp}`}
          activity={activity}
        />
      ))}

      {activities.length > maxItems && (
        <div className="text-center pt-2">
          <Button variant="ghost" size="sm" className="text-xs">
            View all {activities.length} activities
          </Button>
        </div>
      )}
    </div>
  )
}
