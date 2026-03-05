import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import { listQuerySchema } from "@/lib/validators/query-schemas"
import type { ApiResponse } from "@/types/api"
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
      error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
    }
    return NextResponse.json(response, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const queryResult = listQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    perPage: searchParams.get("perPage") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    namespace: searchParams.get("namespace") ?? undefined,
  })

  if (!queryResult.success) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: queryResult.error.flatten() },
    }
    return NextResponse.json(response, { status: 422 })
  }

  const { page, perPage, search, namespace } = queryResult.data

  const provider = createProvider(registry)

  try {
    const result = search && provider.capabilities().canSearch
      ? await provider.searchRepositories(search)
      : await provider.listRepositories({ page, perPage, namespace })

    const items: Repository[] = search
      ? result.items.filter(repo =>
        repo.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        repo.name?.toLowerCase().includes(search.toLowerCase())
      )
      : result.items

    const response: ApiResponse<Repository[]> = {
      success: true,
      data: items,
      error: null,
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
    })
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "REPOSITORIES_FETCH_FAILED",
        message: "Unable to fetch repositories",
        details: error instanceof Error ? error.message : String(error),
      },
    }
    return NextResponse.json(response, { status: 502 })
  }
}
