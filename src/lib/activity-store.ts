import { randomUUID } from "crypto"
import fs from "fs"
import path from "path"
import { config } from "@/lib/config"
import type { ActivityItem } from "@/contexts/activity-context"

export interface ActivityInput {
  type: "push" | "pull" | "delete" | "connect" | "view" | "inspect"
  repository: string
  registry: string
  tag?: string
  user?: string
}

function getStorePath(): string {
  return path.join(config.DATA_DIR, "activities.json")
}

function ensureDataDir(): void {
  fs.mkdirSync(config.DATA_DIR, { recursive: true })
}

// Atomic write: back up the current file then swap in via rename (POSIX atomic)
function atomicWrite(filePath: string, content: string): void {
  const tmpPath = `${filePath}.tmp`
  fs.writeFileSync(tmpPath, content, "utf-8")
  if (fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, `${filePath}.bak`)
  }
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
    return JSON.parse(raw) as ActivityItem[]
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
