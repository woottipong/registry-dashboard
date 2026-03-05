import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()

    if (!session.user) {
      return NextResponse.json(
        { error: { message: "Not authenticated" } },
        { status: 401 }
      )
    }

    return NextResponse.json({ username: session.user.username })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    )
  }
}
