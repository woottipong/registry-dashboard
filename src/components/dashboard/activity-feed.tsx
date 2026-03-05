"use client"

import React from "react"
import { formatDistanceToNow } from "date-fns"
import { ActivityIcon, ArrowDownIcon, ArrowUpIcon, Trash2Icon, ServerIcon, EyeIcon, SearchIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface ActivityItem {
  id: string
  type: 'push' | 'pull' | 'delete' | 'connect' | 'view' | 'inspect'
  repository: string
  registry: string
  tag?: string
  user?: string
  timestamp: Date
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

const ActivityIconMap = {
  push: ArrowUpIcon,
  pull: ArrowDownIcon,
  delete: Trash2Icon,
  connect: ServerIcon,
  view: EyeIcon,
  inspect: SearchIcon,
}

const ActivityColorMap = {
  push: "text-green-600 bg-green-50 border-green-200",
  pull: "text-blue-600 bg-blue-50 border-blue-200",
  delete: "text-red-600 bg-red-50 border-red-200",
  connect: "text-purple-600 bg-purple-50 border-purple-200",
  view: "text-amber-600 bg-amber-50 border-amber-200",
  inspect: "text-indigo-600 bg-indigo-50 border-indigo-200",
}

function ActivityItem({ activity }: { activity: ActivityItem }) {
  const Icon = ActivityIconMap[activity.type]
  const colorClass = ActivityColorMap[activity.type]

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group">
      <div className={`flex-shrink-0 p-2 rounded-lg border ${colorClass}`}>
        <Icon className="size-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground">
            {activity.repository}
            {activity.tag && <span className="text-muted-foreground">:{activity.tag}</span>}
          </span>
          <Badge variant="outline" className="text-xs">
            {activity.type}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{activity.registry}</span>
          {activity.user && (
            <>
              <span>•</span>
              <span>{activity.user}</span>
            </>
          )}
          <span>•</span>
          <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ActivityIcon className="size-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 max-h-96 overflow-y-auto">
      {activities.map((activity) => (
        <ActivityItem key={activity.id} activity={activity} />
      ))}
    </div>
  )
}
