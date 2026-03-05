import { NextResponse } from "next/server"
import { z } from "zod"
import { createActivity, listActivities } from "@/lib/activity-store"
import type { ApiResponse } from "@/types/api"
import type { ActivityItem } from "@/contexts/activity-context"

const activitySchema = z.object({
  type: z.enum(['push', 'pull', 'delete', 'connect', 'view', 'inspect']),
  repository: z.string(),
  registry: z.string(),
  tag: z.string().optional(),
  user: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const registry = searchParams.get('registry')

    const activities = listActivities({ limit, registry: registry || undefined })

    const response: ApiResponse<ActivityItem[]> = {
      success: true,
      data: activities,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "FETCH_ACTIVITIES_FAILED",
        message: "Failed to fetch activities",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = activitySchema.parse(body)

    const activity = createActivity(validatedData)

    const response: ApiResponse<ActivityItem> = {
      success: true,
      data: activity,
      error: null,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: error instanceof z.ZodError ? "INVALID_PAYLOAD" : "CREATE_ACTIVITY_FAILED",
        message: "Failed to create activity",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 400 })
  }
}
