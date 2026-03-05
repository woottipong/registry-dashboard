import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to these paths without authentication
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/logout",
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
