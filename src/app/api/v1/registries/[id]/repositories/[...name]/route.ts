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
  const registry = getRegistry(id)

  if (!registry) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
    }
    return NextResponse.json(response, { status: 404 })
  }

  // Detect /tags suffix
  const lastSegment = name[name.length - 1]
  if (lastSegment === "tags") {
    return listTags(request, registry, id, name.slice(0, -1))
  }

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: { code: "NOT_FOUND", message: "Route not found" },
  }
  return NextResponse.json(response, { status: 404 })
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

async function listTags(
  request: Request,
  registry: Awaited<ReturnType<typeof getRegistry>>,
  _id: string,
  nameParts: string[],
) {
  const repositoryName = nameParts.join("/")
  const { searchParams } = new URL(request.url)
  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("perPage") ?? "50")

  try {
    const provider = createProvider(registry!)
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
