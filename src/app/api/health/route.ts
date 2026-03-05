import { NextResponse } from "next/server"
import type { ApiResponse } from "@/types/api"

const startedAt = Date.now()

interface HealthData {
  status: "ok"
  version: string
  uptimeMs: number
}

export async function GET() {
  const response: ApiResponse<HealthData> = {
    success: true,
    data: {
      status: "ok",
      version: process.env.npm_package_version ?? "0.1.0",
      uptimeMs: Date.now() - startedAt,
    },
    error: null,
  }

  return NextResponse.json(response)
}
