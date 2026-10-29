import { NextResponse } from "next/server"
import { getRegistry } from "@/lib/registry-store"
import { listTagsHandler } from "@/lib/server/repository-handlers"
import type { ApiResponse } from "@/types/api"

interface RouteContext {
  params: Promise<{ id: string; name: string[] }>
}

/**
 * Dedicated sub-resource route handler for repository tags:
 * GET /api/v1/registries/[id]/tags/[...name]
 */
export async function GET(request: Request, context: RouteContext) {
  const { id, name } = await context.params

  if (!id) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "INVALID_REQUEST", message: "Registry ID is required" },
    }
    return NextResponse.json(response, { status: 400 })
  }

  if (!name || name.length === 0) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "INVALID_REQUEST", message: "Repository name is required" },
    }
    return NextResponse.json(response, { status: 400 })
  }

  const registry = getRegistry(id)
  if (!registry) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
    }
    return NextResponse.json(response, { status: 404 })
  }

  const repositoryName = name.join("/")
  const { searchParams } = new URL(request.url)
  return listTagsHandler(registry, repositoryName, searchParams)
}

