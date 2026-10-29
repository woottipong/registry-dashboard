import { randomUUID } from "crypto"
import path from "path"
import { AtomicJsonStore } from "@/lib/atomic-file-store"
import { config } from "@/lib/config"
import type { ActivityItem } from "@/contexts/activity-context"

export interface ActivityInput {
  type: "push" | "pull" | "delete" | "connect" | "view" | "inspect"
  repository: string
  registry: string
  tag?: string
  user?: string
}

const fileStore = new AtomicJsonStore<ActivityItem[]>(
  () => path.join(config.DATA_DIR, "activities.json"),
  () => [],
  "[activity-store]",
)

function readStore(): ActivityItem[] {
  return fileStore.read()
}

function writeStore(activities: ActivityItem[]): void {
  fileStore.write(activities)
}

export function listActivities(options: { limit?: number; registry?: string } = {}): ActivityItem[] {
  const { limit = 50, registry } = options
  let activities = readStore()

  // Filter by registry if specified
  if (registry) {
    activities = activities.filter(activity => activity.registry === registry)
  }

  // Sort by timestamp (newest first) and limit
  return activities
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}

export function createActivity(payload: ActivityInput): ActivityItem {
  const activities = readStore()
  const id = randomUUID()

  const activity: ActivityItem = {
    id,
    type: payload.type,
    repository: payload.repository,
    registry: payload.registry,
    tag: payload.tag,
    user: payload.user,
    timestamp: new Date().toISOString(),
  }

  // Add to the beginning of the array (newest first)
  activities.unshift(activity)

  // Keep only the last 1000 activities to prevent file from growing too large
  const trimmedActivities = activities.slice(0, 1000)

  writeStore(trimmedActivities)
  return activity
}

export function clearActivities(): void {
  writeStore([])
}
