import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Tag } from "@/types/registry"

interface RouteContext {
  params: Promise<{ id: string; name: string[] }>
}

export async function GET(request: Request, context: RouteContext) {
  const { id, name } = await context.params
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

  const repositoryName = name.join("/")
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("perPage") ?? "50")

  try {
    const provider = createProvider(registry)
    const result = await provider.listTags(repositoryName, { page, perPage })

    const meta: PaginationMeta = {
      page: result.page,
      perPage: result.perPage,
      total: result.total ?? result.items.length,
      totalPages:
        result.total && result.perPage
          ? Math.max(1, Math.ceil(result.total / result.perPage))
          : 1,
      nextCursor: result.nextCursor,
    }

    const response: ApiResponse<Tag[]> = {
      success: true,
      data: result.items,
      error: null,
      meta,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "TAGS_FETCH_FAILED",
        message: `Unable to fetch tags for ${repositoryName}`,
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 502 })
  }
}
