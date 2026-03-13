import { NextResponse } from "next/server"
import {
  createRegistry,
  listRegistries,
  parseRegistryInput,
} from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"
import type { ApiResponse } from "@/types/api"

export async function GET() {
  const registries = listRegistries().map(sanitizeRegistry)

  const response: ApiResponse<ReturnType<typeof sanitizeRegistry>[]> = {
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

    const response: ApiResponse<ReturnType<typeof sanitizeRegistry>> = {
      success: true,
      data: sanitizeRegistry(created),
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
