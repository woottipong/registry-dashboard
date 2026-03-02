import { NextResponse } from "next/server"
import {
  deleteRegistry,
  getRegistry,
  parseRegistryInput,
  updateRegistry,
} from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { RegistryConnection } from "@/types/registry"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params

  try {
    const body = await request.json()
    const payload = parseRegistryInput(body)
    const updated = updateRegistry(id, payload)

    if (!updated) {
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

    const response: ApiResponse<RegistryConnection> = {
      success: true,
      data: updated,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Unable to update registry",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 400 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params

  if (!getRegistry(id)) {
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

  deleteRegistry(id)

  const response: ApiResponse<null> = {
    success: true,
    data: null,
    error: null,
  }

  return NextResponse.json(response)
}
