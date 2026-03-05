import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import type { ApiResponse } from "@/types/api"

export async function GET() {
  try {
    const session = await getSession()

    if (!session.user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: { code: "UNAUTHENTICATED", message: "Not authenticated" },
      }
      return NextResponse.json(response, { status: 401 })
    }

    const response: ApiResponse<{ username: string }> = {
      success: true,
      data: { username: session.user.username },
      error: null,
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Auth check error:", error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    }
    return NextResponse.json(response, { status: 500 })
  }
}
