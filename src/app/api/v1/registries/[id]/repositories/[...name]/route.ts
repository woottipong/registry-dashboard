import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { Tag } from "@/types/registry"

interface RouteContext {
  params: Promise<{ id: string; name: string[] }>
}

// Route handles three patterns:
//   GET /repositories/{...repoName}/tags  → list tags (last segment is "tags")
//   DELETE /repositories/{...repoName}    → delete repository (all tags)
//   GET /repositories/{...repoName}       → repo detail (future)
export async function GET(request: Request, context: RouteContext) {
  const { id, name } = await context.params

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

  // Check if this is a tags request
  const lastSegment = name[name.length - 1]
  if (lastSegment !== "tags") {
    return NextResponse.json(
      { errors: [{ code: "NOT_FOUND", message: "Route not found" }] },
      { status: 404 }
    )
  }

  const repositoryName = name.slice(0, -1).join("/")
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("perPage") ?? "50")

  const provider = createProvider(registry)

  try {
    const result = await provider.listTags(repositoryName, { page, perPage })

    const response: ApiResponse<Tag[]> = {
      success: true,
      data: result.items,
      error: null,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        errors: [{
          code: "UNKNOWN",
          message: `Unable to fetch tags for ${repositoryName}`,
          detail: error instanceof Error ? error.message : String(error)
        }]
      },
      { status: 502 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, name } = await context.params
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

  try {
    const provider = createProvider(registry!)
    
    // Check if provider supports deletion
    const capabilities = provider.capabilities()
    if (!capabilities.canDelete) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: "DELETE_NOT_SUPPORTED",
          message: "This registry provider does not support repository deletion",
        },
      }
      return NextResponse.json(response, { status: 405 })
    }

    // Get all tags first
    const tagsResult = await provider.listTags(repositoryName, { page: 1, perPage: 1000 })

    // Deduplicate digests — multiple tags can share one manifest (same sha256)
    // Only delete each unique digest once; skip empty/unresolved digests
    const uniqueDigests = [...new Set(
      tagsResult.items
        .map((t) => t.digest)
        .filter((d) => d?.startsWith("sha256:"))
    )]

    for (const digest of uniqueDigests) {
      await provider.deleteManifest(repositoryName, digest)
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      error: null,
    }
    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "REPOSITORY_DELETE_FAILED",
        message: `Unable to delete repository ${repositoryName}`,
        details: error instanceof Error ? error.message : error,
      },
    }
    return NextResponse.json(response, { status: 502 })
  }
}
