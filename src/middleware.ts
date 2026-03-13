import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

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

  // Allow access to these paths without authentication
  // Note: /api/auth/logout is NOT public — it requires a valid session
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/health",
    "/_next",
    "/favicon.ico",
    "/icon.svg",
  ]
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + "/")
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  const session = await getSession()

  if (!session.user) {
    // Redirect to login page
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
