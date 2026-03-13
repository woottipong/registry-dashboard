import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import { z } from "zod"
import { config } from "@/lib/config"
import type { ActivityItem } from "@/contexts/activity-context"

const activityInputSchema = z.object({
  type: z.enum(['push', 'pull', 'delete', 'connect', 'view', 'inspect']),
  repository: z.string(),
  registry: z.string(),
  tag: z.string().optional(),
  user: z.string().optional(),
})

export type ActivityInput = z.infer<typeof activityInputSchema>

function getStorePath(): string {
  return path.join(config.DATA_DIR, "activities.json")
}

function ensureDataDir(): void {
  fs.mkdirSync(config.DATA_DIR, { recursive: true })
}

// Atomic write: back up the current file then swap in via rename (POSIX atomic)
function atomicWrite(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`)
  }
  const tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, content, "utf-8")
  fs.renameSync(tmpPath, filePath)
}

// Safe read: falls back to the .bak file if the main file is corrupt/missing
function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8")
  } catch {
    try {
      return fs.readFileSync(`${filePath}.bak`, "utf-8")
    } catch {
      return null
    }
  }
}

function readStore(): ActivityItem[] {
  const storePath = getStorePath()
  const raw = safeReadFile(storePath)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as ActivityItem[]
    // Convert timestamp strings back to Date objects
    return parsed.map(activity => ({
      ...activity,
      timestamp: new Date(activity.timestamp)
    }))
  } catch {
    console.error("[activity-store] Failed to parse store, starting fresh")
    return []
  }
}

function writeStore(activities: ActivityItem[]): void {
  ensureDataDir()
  const storePath = getStorePath()
  atomicWrite(storePath, JSON.stringify(activities, null, 2))
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
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

export function createActivity(payload: ActivityInput): ActivityItem {
  const activities = readStore()
  const id = randomUUID()
  const now = new Date()

  const activity: ActivityItem = {
    id,
    type: payload.type,
    repository: payload.repository,
    registry: payload.registry,
    tag: payload.tag,
    user: payload.user,
    timestamp: now,
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
