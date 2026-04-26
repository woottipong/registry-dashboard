import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

vi.mock("@/lib/config", () => ({
  config: {
    DATA_DIR: "",
    SESSION_SECRET: "test-session-secret-32-chars-min!",
    APP_USERNAME: "admin",
    APP_PASSWORD: "password",
  },
}))

import { config } from "@/lib/config"
import { createActivity, listActivities, clearActivities } from "@/lib/activity-store"

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "activity-store-test-"))
  ;(config as { DATA_DIR: string }).DATA_DIR = tmpDir
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

const BASE_ACTIVITY = {
  type: "push" as const,
  repository: "app/web",
  registry: "registry-1",
}

describe("createActivity()", () => {
  it("persists an activity and returns it with id and timestamp", () => {
    const activity = createActivity(BASE_ACTIVITY)

    expect(activity.id).toBeTruthy()
    expect(activity.type).toBe("push")
    expect(activity.repository).toBe("app/web")
    expect(activity.registry).toBe("registry-1")
    expect(activity.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("stores optional tag and user fields", () => {
    const activity = createActivity({
      ...BASE_ACTIVITY,
      tag: "v1.2.3",
      user: "alice",
    })

    expect(activity.tag).toBe("v1.2.3")
    expect(activity.user).toBe("alice")
  })

  it("newest activity appears first in list", () => {
    createActivity({ ...BASE_ACTIVITY, repository: "first" })
    createActivity({ ...BASE_ACTIVITY, repository: "second" })

    const list = listActivities()
    expect(list[0].repository).toBe("second")
    expect(list[1].repository).toBe("first")
  })

  it("assigns a unique id per activity", () => {
    const a1 = createActivity(BASE_ACTIVITY)
    const a2 = createActivity(BASE_ACTIVITY)

    expect(a1.id).not.toBe(a2.id)
  })
})

describe("listActivities()", () => {
  it("returns empty array when no activities exist", () => {
    expect(listActivities()).toEqual([])
  })

  it("returns all activities sorted by timestamp desc", () => {
    createActivity({ ...BASE_ACTIVITY, repository: "alpha" })
    createActivity({ ...BASE_ACTIVITY, repository: "beta" })
    createActivity({ ...BASE_ACTIVITY, repository: "gamma" })

    const list = listActivities()
    expect(list).toHaveLength(3)
    expect(list[0].repository).toBe("gamma")
  })

  it("limits results via limit option", () => {
    createActivity({ ...BASE_ACTIVITY, repository: "a" })
    createActivity({ ...BASE_ACTIVITY, repository: "b" })
    createActivity({ ...BASE_ACTIVITY, repository: "c" })

    const list = listActivities({ limit: 2 })
    expect(list).toHaveLength(2)
  })

  it("filters by registry", () => {
    createActivity({ ...BASE_ACTIVITY, registry: "reg-a" })
    createActivity({ ...BASE_ACTIVITY, registry: "reg-b" })
    createActivity({ ...BASE_ACTIVITY, registry: "reg-a" })

    const filtered = listActivities({ registry: "reg-a" })
    expect(filtered).toHaveLength(2)
    expect(filtered.every(a => a.registry === "reg-a")).toBe(true)
  })

  it("returns empty array when registry filter matches nothing", () => {
    createActivity(BASE_ACTIVITY)

    const result = listActivities({ registry: "nonexistent" })
    expect(result).toEqual([])
  })

  it("combines limit and registry filter", () => {
    createActivity({ ...BASE_ACTIVITY, registry: "reg-a", repository: "r1" })
    createActivity({ ...BASE_ACTIVITY, registry: "reg-a", repository: "r2" })
    createActivity({ ...BASE_ACTIVITY, registry: "reg-a", repository: "r3" })

    const result = listActivities({ registry: "reg-a", limit: 2 })
    expect(result).toHaveLength(2)
  })
})

describe("clearActivities()", () => {
  it("removes all activities", () => {
    createActivity(BASE_ACTIVITY)
    createActivity(BASE_ACTIVITY)

    clearActivities()

    expect(listActivities()).toEqual([])
  })

  it("is idempotent on empty store", () => {
    expect(() => clearActivities()).not.toThrow()
    expect(listActivities()).toEqual([])
  })
})

describe("timestamp persistence", () => {
  it("deserialises timestamps as ISO strings on read", () => {
    createActivity(BASE_ACTIVITY)

    const list = listActivities()
    expect(list[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
