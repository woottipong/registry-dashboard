import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: { message: "Username and password are required" } },
        { status: 400 }
      )
    }

    // Check credentials using timing-safe comparison
    const isValidUsername = username === config.APP_USERNAME
    const isValidPassword = await timingSafeEqual(password, config.APP_PASSWORD)

    if (!isValidUsername || !isValidPassword) {
      return NextResponse.json(
        { error: { message: "Invalid username or password" } },
        { status: 401 }
      )
    }

    // Create session
    const session = await getSession()
    session.user = { username: config.APP_USERNAME }
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 }
    )
  }
}

// Timing-safe string comparison to prevent timing attacks
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
