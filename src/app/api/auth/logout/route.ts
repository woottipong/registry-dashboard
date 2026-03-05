import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import type { ApiResponse } from "@/types/api"

export async function POST() {
  try {
    const session = await getSession()
    session.destroy()

    const response: ApiResponse<null> = { success: true, data: null, error: null }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Logout error:", error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    }
    return NextResponse.json(response, { status: 500 })
  }
}
