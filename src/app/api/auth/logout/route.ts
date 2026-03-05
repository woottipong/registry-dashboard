import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function POST(request: NextRequest) {
  try {
    // Destroy session
    const session = await getSession()
    session.destroy()

    // Redirect to login page
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    )
  }
}
