import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
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

function sanitize(registry: RegistryConnection) {
  const { credentials, ...rest } = registry
  return {
    ...rest,
    hasCredentials: !!(credentials?.password || credentials?.token),
    capabilities: createProvider(registry).capabilities(),
  }
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

  const response: ApiResponse<ReturnType<typeof sanitize>> = {
    success: true,
    data: sanitize(registry),
    error: null,
  }

  return NextResponse.json(response)
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

    const response: ApiResponse<ReturnType<typeof sanitize>> = {
      success: true,
      data: sanitize(updated),
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[PUT /api/v1/registries/:id]", error)
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: error instanceof Error ? error.message : "Unable to update registry",
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
