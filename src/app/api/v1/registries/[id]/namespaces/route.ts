import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { Namespace } from "@/types/registry"

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
      error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
    }
    return NextResponse.json(response, { status: 404 })
  }

  const provider = createProvider(registry)

  try {
    const namespaces = await provider.listNamespaces()

    const response: ApiResponse<Namespace[]> = {
      success: true,
      data: namespaces,
      error: null,
    }

    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    })
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "NAMESPACES_FETCH_FAILED",
        message: "Unable to fetch namespaces",
        details: error instanceof Error ? error.message : String(error),
      },
    }
    return NextResponse.json(response, { status: 502 })
  }
}
