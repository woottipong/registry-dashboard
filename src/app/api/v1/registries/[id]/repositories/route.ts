import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Repository } from "@/types/registry"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, context: RouteContext) {
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

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("perPage") ?? "25")
  const search = searchParams.get("search")?.trim() ?? ""

  const provider = createProvider(registry)

  try {
    const result =
      search && provider.capabilities().canSearch
        ? await provider.searchRepositories(search)
        : await provider.listRepositories({ page, perPage })

    const items = search
      ? result.items.filter((repo) =>
          repo.fullName.toLowerCase().includes(search.toLowerCase()),
        )
      : result.items

    const meta: PaginationMeta = {
      page: result.page,
      perPage: result.perPage,
      total: result.total ?? items.length,
      totalPages:
        result.total && result.perPage
          ? Math.max(1, Math.ceil(result.total / result.perPage))
          : 1,
      nextCursor: result.nextCursor,
    }

    const response: ApiResponse<Repository[]> = {
      success: true,
      data: items,
      error: null,
      meta,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "REPOSITORIES_FETCH_FAILED",
        message: "Unable to fetch repositories",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 502 })
  }
}
