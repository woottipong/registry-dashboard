import { NextResponse } from "next/server"
import { createProvider } from "@/lib/providers"
import { getRegistry } from "@/lib/registry-store"
import type { ApiResponse } from "@/types/api"
import type { ImageManifest } from "@/types/manifest"

interface RouteContext {
  params: Promise<{ id: string; path: string[] }>
}

function splitManifestPath(path: string[]): { repo: string; ref: string } {
  if (path.length < 2) {
    throw new Error("Expected path format: [...repo]/[ref]")
  }

  const ref = path[path.length - 1]
  const repo = path.slice(0, -1).join("/")

  return { repo, ref }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id, path } = await context.params
  const registry = getRegistry(id)

  if (!registry) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
      } satisfies ApiResponse<null>,
      { status: 404 },
    )
  }

  try {
    const { repo, ref } = splitManifestPath(path)
    const provider = createProvider(registry)
    const manifest = await provider.getManifest(repo, ref)

    return NextResponse.json({
      success: true,
      data: manifest,
      error: null,
    } satisfies ApiResponse<ImageManifest>, {
      headers: {
        "Cache-Control": "s-maxage=600",
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "MANIFEST_FETCH_FAILED",
          message: "Unable to fetch manifest",
          details: error instanceof Error ? error.message : error,
        },
      } satisfies ApiResponse<null>,
      { status: 502 },
    )
  }
}

export async function HEAD(_request: Request, context: RouteContext) {
  const { id, path } = await context.params
  const registry = getRegistry(id)

  if (!registry) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const { repo, ref } = splitManifestPath(path)
    const provider = createProvider(registry)
    const manifest = await provider.getManifest(repo, ref)

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Docker-Content-Digest": manifest.digest,
      },
    })
  } catch {
    return new NextResponse(null, { status: 502 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, path } = await context.params
  const registry = getRegistry(id)

  if (!registry) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "REGISTRY_NOT_FOUND", message: `Registry ${id} was not found` },
      } satisfies ApiResponse<null>,
      { status: 404 },
    )
  }

  try {
    const { repo, ref } = splitManifestPath(path)
    const provider = createProvider(registry)

    if (!provider.capabilities().canDelete) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "DELETE_NOT_SUPPORTED",
            message: "This registry provider does not support deleting manifests",
          },
        } satisfies ApiResponse<null>,
        { status: 405 },
      )
    }

    await provider.deleteManifest(repo, ref)

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    } satisfies ApiResponse<null>)
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "MANIFEST_DELETE_FAILED",
          message: "Unable to delete manifest",
          details: error instanceof Error ? error.message : error,
        },
      } satisfies ApiResponse<null>,
      { status: 502 },
    )
  }
}
