import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { logApiError } from "@/lib/error-handling"
import { parseRepositoryName } from "@/lib/format"
import { listQuerySchema } from "@/lib/validators/query-schemas"
import type { ApiResponse, PaginationMeta } from "@/types/api"
import type { RegistryConnection, Repository, Tag } from "@/types/registry"

/**
 * Handles listing tags for a repository with pagination and validation.
 */
export async function listTagsHandler(
  registry: RegistryConnection,
  repositoryName: string,
  searchParams: URLSearchParams,
): Promise<NextResponse<ApiResponse<Tag[] | null>>> {
  const queryResult = listQuerySchema.pick({ page: true, perPage: true }).safeParse({
    page: searchParams.get("page") ?? undefined,
    perPage: searchParams.get("perPage") ?? undefined,
  })

  if (!queryResult.success) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: { code: "VALIDATION_ERROR", message: "Invalid query parameters" },
    }
    return NextResponse.json(response, { status: 422 })
  }

  const { page, perPage } = queryResult.data
  const provider = createProvider(registry)

  try {
    const result = await provider.listTags(repositoryName, { page, perPage })

    const meta: PaginationMeta = {
      page: result.page,
      perPage: result.perPage,
      total: result.total ?? result.items.length,
      totalPages: result.total ? Math.ceil(result.total / result.perPage) : 1,
      nextCursor: result.nextCursor,
    }

    const response: ApiResponse<Tag[]> = {
      success: true,
      data: result.items,
      error: null,
      meta,
    }

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
      },
    })
  } catch (error) {
    logApiError("GET /api/v1/registries/:id/repositories/:name/tags", error, {
      registryId: registry.id,
      repositoryName,
    })
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "TAGS_FETCH_FAILED",
        message: `Unable to fetch tags for ${repositoryName}`,
      },
    }
    return NextResponse.json(response, { status: 502 })
  }
}

/**
 * Handles fetching repository metadata and partition information.
 */
export async function getRepositoryDetailHandler(
  registry: RegistryConnection,
  repositoryName: string,
): Promise<NextResponse<ApiResponse<Repository>>> {
  const parsed = parseRepositoryName(repositoryName)

  const repository: Repository = {
    name: parsed.name,
    namespace: parsed.namespace || undefined,
    fullName: repositoryName,
  }

  const response: ApiResponse<Repository> = {
    success: true,
    data: repository,
    error: null,
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
    },
  })
}

/**
 * Handles deleting a repository and all its associated manifests.
 */
export async function deleteRepositoryHandler(
  registry: RegistryConnection,
  repositoryName: string,
): Promise<NextResponse<ApiResponse<null>>> {
  if (repositoryName.endsWith("/tags") || repositoryName === "tags") {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "INVALID_REQUEST",
        message: "Cannot perform repository deletion on a tags sub-path",
      },
    }
    return NextResponse.json(response, { status: 400 })
  }

  try {
    const provider = createProvider(registry)

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

    // List all tags to resolve digests for deletion
    const tagsResult = await provider.listTags(repositoryName, { page: 1, perPage: 1000 })

    // Deduplicate digests — multiple tags can point to the same manifest
    const uniqueDigests = [
      ...new Set(
        tagsResult.items
          .map((t) => t.digest)
          .filter((d): d is string => Boolean(d?.startsWith("sha256:"))),
      ),
    ]

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
    logApiError("DELETE /api/v1/registries/:id/repositories/:name", error, {
      registryId: registry.id,
      repositoryName,
    })
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "REPOSITORY_DELETE_FAILED",
        message: `Unable to delete repository ${repositoryName}`,
      },
    }
    return NextResponse.json(response, { status: 502 })
  }
}
