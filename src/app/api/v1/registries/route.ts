import { NextResponse } from "next/server"
import {
  createRegistry,
  listRegistries,
  parseRegistryInput,
} from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

export async function GET() {
  const response: ApiResponse<RegistryConnection[]> = {
    success: true,
    data: listRegistries(),
    error: null,
  }

  return NextResponse.json(response)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const payload = parseRegistryInput(body)
    const created = createRegistry(payload)

    const response: ApiResponse<RegistryConnection> = {
      success: true,
      data: created,
      error: null,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Unable to create registry",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 400 })
  }
}
