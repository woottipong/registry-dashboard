import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
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

  const provider = createProvider(registry)

  try {
    // listNamespaces only fetches catalog names (no per-repo tag fetches) — fast
    const namespaces = await provider.listNamespaces()

    return NextResponse.json({ namespaces }, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        errors: [{
          code: "UNKNOWN",
          message: "Unable to fetch namespaces",
          detail: error instanceof Error ? error.message : String(error)
        }]
      },
      { status: 502 }
    )
  }
}
