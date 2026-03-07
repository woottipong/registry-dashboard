import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import {
  createRegistry,
  listRegistries,
  parseRegistryInput,
} from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

// Strip credential values before sending to the client — authType and
// hasCredentials are enough for the UI; actual secrets must stay server-side.
function sanitize(registry: RegistryConnection) {
  const { credentials, ...rest } = registry
  return {
    ...rest,
    hasCredentials: !!(credentials?.password || credentials?.token),
    capabilities: createProvider(registry).capabilities(),
  }
}

export async function GET() {
  const registries = listRegistries().map(sanitize)

  const response: ApiResponse<ReturnType<typeof sanitize>[]> = {
    success: true,
    data: registries,
    error: null,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "private, max-age=30",
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = parseRegistryInput(body)
    const created = createRegistry(payload)

    const response: ApiResponse<ReturnType<typeof sanitize>> = {
      success: true,
      data: sanitize(created),
      error: null,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error("[POST /api/v1/registries]", error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: error instanceof Error ? error.message : "Unable to create registry",
      },
    }

    return NextResponse.json(response, { status: 400 })
  }
}
