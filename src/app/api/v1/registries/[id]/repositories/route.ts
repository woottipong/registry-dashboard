import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

// Docker Registry HTTP API v2 compatible endpoint
// Returns repositories in Docker Registry catalog format
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json(
      { errors: [{ code: "INVALID_REQUEST", message: "Registry ID is required" }] },
      { status: 400 }
    )
  }

  const registry = getRegistry(id)
  if (!registry) {
    return NextResponse.json(
      { errors: [{ code: "NAME_UNKNOWN", message: `Registry ${id} not found` }] },
      { status: 404 }
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("perPage") ?? "25")
  const search = searchParams.get("search")?.trim() ?? ""
  const namespace = searchParams.get("namespace")?.trim() ?? ""

  const provider = createProvider(registry)

  try {
    const result = search && provider.capabilities().canSearch
      ? await provider.searchRepositories(search)
      : await provider.listRepositories({ page, perPage, namespace: namespace || undefined })

    const items = search
      ? result.items.filter(repo =>
          repo.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          repo.name?.toLowerCase().includes(search.toLowerCase())
        )
      : result.items

    return NextResponse.json({ items }, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        errors: [{
          code: "UNKNOWN",
          message: "Unable to fetch repositories",
          detail: error instanceof Error ? error.message : String(error)
        }]
      },
      { status: 502 }
    )
  }
}
