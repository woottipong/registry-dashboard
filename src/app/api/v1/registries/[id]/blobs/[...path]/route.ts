import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { ImageConfig } from "@/types/manifest"

interface RouteContext {
  params: Promise<{ id: string; path: string[] }>
}

function splitBlobPath(path: string[]): { repo: string; digest: string } {
  if (path.length < 2) {
    throw new Error("Expected path format: [...repo]/[digest]")
  }

  const digest = path[path.length - 1]
  const repo = path.slice(0, -1).join("/")

  return { repo, digest }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id, path } = await context.params
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

  try {
    const { repo, digest } = splitBlobPath(path)
    const provider = createProvider(registry)
    const config = await provider.getConfig(repo, digest)

    const response: ApiResponse<ImageConfig> = {
      success: true,
      data: config,
      error: null,
    }

    return NextResponse.json(response)
  } catch (error) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: "BLOB_FETCH_FAILED",
        message: "Unable to fetch config blob",
        details: error instanceof Error ? error.message : error,
      },
    }

    return NextResponse.json(response, { status: 502 })
  }
}
