import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { logApiError } from "@/lib/error-handling"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const registry = getRegistry(id)

  if (!registry) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "REGISTRY_NOT_FOUND",
        message: `Registry ${id} was not found`,
      },
    }

    return NextResponse.json(response, { status: 404 })
  }

  const provider = createProvider(registry)
  const startedAt = performance.now()

  try {
    const isReachable = await provider.ping()
    const latencyMs = Math.round(performance.now() - startedAt)

    const response: ApiResponse<{ status: "ok" | "error"; latencyMs: number }> = {
      success: true,
      data: {
        status: isReachable ? "ok" : "error",
        latencyMs,
      },
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    logApiError("GET /api/v1/registries/:id/ping", error, { registryId: id })

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "PING_FAILED",
        message: "Unable to reach registry",
      },
    }

    return NextResponse.json(response, { status: 502 })
  }
}
