import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { getSession } from "@/lib/session"
import { config } from "@/lib/config"
import type { ApiResponse } from "@/types/api"

// In-memory rate limiter: max 5 attempts per IP per 15 minutes
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const attemptStore = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

function checkRateLimit(ip: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = attemptStore.get(ip)

  if (!entry || now > entry.resetAt) {
    attemptStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { limited: false, retryAfterSec: 0 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { limited: true, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { limited: false, retryAfterSec: 0 }
}

function clearRateLimit(ip: string): void {
  attemptStore.delete(ip)
}

// Constant-time string comparison using Node crypto — pads to same length to prevent length leak
function safeCompare(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const bufA = encoder.encode(a.padEnd(Math.max(a.length, b.length), "\0"))
  const bufB = encoder.encode(b.padEnd(Math.max(a.length, b.length), "\0"))
  return timingSafeEqual(bufA, bufB)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  try {
    const body = await request.json()
    const username = typeof body.username === "string" ? body.username.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""

    if (!username || !password) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: { code: "INVALID_PAYLOAD", message: "Username and password are required" },
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Rate limit check
    const { limited, retryAfterSec } = checkRateLimit(ip)
    if (limited) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: { code: "RATE_LIMITED", message: `Too many attempts. Try again in ${retryAfterSec} seconds.` },
      }
      return NextResponse.json(response, {
        status: 429,
        headers: { "Retry-After": String(retryAfterSec) },
      })
    }

    // Constant-time comparison for both fields — always compare both to avoid short-circuit timing leak
    const validUsername = safeCompare(username, config.APP_USERNAME)
    const validPassword = safeCompare(password, config.APP_PASSWORD)

    if (!validUsername || !validPassword) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: { code: "INVALID_CREDENTIALS", message: "Invalid username or password" },
      }
      return NextResponse.json(response, { status: 401 })
    }

    // Success — clear rate limit and create session
    clearRateLimit(ip)
    const session = await getSession()
    session.user = { username: config.APP_USERNAME }
    await session.save()

    const response: ApiResponse<{ username: string }> = {
      success: true,
      data: { username: config.APP_USERNAME },
      error: null,
    }
    return NextResponse.json(response)
  } catch (error) {
    console.error("Login error:", error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    }
    return NextResponse.json(response, { status: 500 })
  }
}
