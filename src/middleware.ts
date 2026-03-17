import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const DELETE_RATE_LIMIT_MAX = 20
const DELETE_RATE_LIMIT_WINDOW_MS = 60 * 1000
const PUBLIC_ROUTES = new Set(["/login", "/api/auth/login", "/api/health"])
const PUBLIC_ROUTE_PREFIXES = ["/_next"]
const PUBLIC_METADATA_PREFIXES = ["/icon", "/apple-icon"]
const PUBLIC_FILE_PATHS = new Set([
  "/favicon.ico",
  "/logo.svg",
  "/icon.svg",
  "/file.svg",
  "/globe.svg",
  "/next.svg",
  "/vercel.svg",
  "/window.svg",
  "/manifest.webmanifest",
])
const deleteAttemptStore = new Map<string, { count: number; resetAt: number }>()
type DeleteRateLimitScope = "manifest-delete" | "repository-delete"

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    (request as unknown as { ip?: string }).ip ??
    "unknown"
  )
}

function isRateLimitedDeletePath(pathname: string): boolean {
  return /^\/api\/v1\/registries\/[^/]+\/(?:manifests|repositories)\//.test(pathname)
}

function getDeleteRateLimitScope(pathname: string): DeleteRateLimitScope | null {
  if (/^\/api\/v1\/registries\/[^/]+\/manifests\//.test(pathname)) {
    return "manifest-delete"
  }

  if (/^\/api\/v1\/registries\/[^/]+\/repositories\//.test(pathname)) {
    return "repository-delete"
  }

  return null
}

function checkDeleteRateLimit(key: string): { limited: boolean; retryAfterSec: number } {
  const now = Date.now()

  for (const [entryKey, entry] of deleteAttemptStore.entries()) {
    if (now > entry.resetAt) {
      deleteAttemptStore.delete(entryKey)
    }
  }

  const entry = deleteAttemptStore.get(key)

  if (!entry) {
    deleteAttemptStore.set(key, { count: 1, resetAt: now + DELETE_RATE_LIMIT_WINDOW_MS })
    return { limited: false, retryAfterSec: 0 }
  }

  if (entry.count >= DELETE_RATE_LIMIT_MAX) {
    return { limited: true, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count += 1
  return { limited: false, retryAfterSec: 0 }
}

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function isPublicAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) {
    return false
  }

  return (
    PUBLIC_FILE_PATHS.has(pathname) ||
    PUBLIC_METADATA_PREFIXES.some(prefix => matchesPathPrefix(pathname, prefix))
  )
}

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_ROUTES.has(pathname) ||
    PUBLIC_ROUTE_PREFIXES.some(prefix => matchesPathPrefix(pathname, prefix)) ||
    isPublicAssetPath(pathname)
  )
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CSRF protection: all state-mutating API calls must include the
  // X-Requested-With: XMLHttpRequest header to prove same-origin intent.
  if (pathname.startsWith("/api/") && !CSRF_SAFE_METHODS.has(request.method)) {
    const xRequestedWith = request.headers.get("X-Requested-With")
    if (xRequestedWith !== "XMLHttpRequest") {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "FORBIDDEN", message: "CSRF check failed: missing X-Requested-With header" },
        },
        { status: 403 },
      )
    }

    // Secondary CSRF defense: validate Origin header matches our host
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")
    if (origin && host) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json(
            {
              success: false,
              data: null,
              error: { code: "FORBIDDEN", message: "CSRF check failed: origin mismatch" },
            },
            { status: 403 },
          )
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: { code: "FORBIDDEN", message: "CSRF check failed: invalid origin" },
          },
          { status: 403 },
        )
      }
    }
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const session = await getSession()

  if (!session.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "UNAUTHENTICATED", message: "Not authenticated" },
        },
        { status: 401 },
      )
    }

    // Redirect to login page
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  if (request.method === "DELETE" && isRateLimitedDeletePath(pathname)) {
    const ip = getClientIp(request)
    const scope = getDeleteRateLimitScope(pathname)
    if (!scope) {
      return NextResponse.next()
    }

    const rateLimitKey = `${session.user.username}:${ip}:${scope}`
    const { limited, retryAfterSec } = checkDeleteRateLimit(rateLimitKey)

    if (limited) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "RATE_LIMITED",
            message: `Too many delete requests. Try again in ${retryAfterSec} seconds.`,
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSec) },
        },
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    "/((?!_next/static|_next/image).*)",
  ],
}
