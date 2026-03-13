import type { NextConfig } from "next"
import { execSync } from "child_process"

function getGitVersion(): string {
  try {
    return execSync("git describe --tags --abbrev=0", { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim()
  } catch {
    return "dev"
  }
}

const isDev = process.env.NODE_ENV === "development"

const CSP = [
  "default-src 'self'",
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // unsafe-eval needed for Next.js dev HMR
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join("; ")

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CSP },
]

const nextConfig: NextConfig = {
  output: "standalone",

  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || getGitVersion(),
  },

  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },

  // Compress responses
  compress: true,
}

export default nextConfig
