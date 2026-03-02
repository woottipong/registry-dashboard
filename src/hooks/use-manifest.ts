"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_MANIFEST } from "@/lib/query-client"
import type { ApiResponse } from "@/types/api"
import type { ImageConfig, ImageManifest } from "@/types/manifest"

interface ManifestResult {
  manifest: ImageManifest
  config: ImageConfig | null
}

function encodeRepoPath(repoName: string): string {
  return repoName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

export function useManifest(registryId: string, repoName: string, ref: string) {
  return useQuery({
    queryKey: ["manifest", registryId, repoName, ref],
    enabled: Boolean(registryId && repoName && ref),
    staleTime: STALE_TIME_MANIFEST,
    queryFn: async (): Promise<ManifestResult> => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const encodedRef = encodeURIComponent(ref)

      const manifestResponse = await fetch(
        `/api/v1/registries/${registryId}/manifests/${encodedRepoPath}/${encodedRef}`,
        { cache: "no-store" },
      )

      const manifestPayload = (await manifestResponse.json()) as ApiResponse<ImageManifest>

      if (!manifestResponse.ok || !manifestPayload.success || !manifestPayload.data) {
        throw new Error(manifestPayload.error?.message ?? "Unable to fetch manifest")
      }

      const digest = manifestPayload.data.config.digest
      const encodedDigest = encodeURIComponent(digest)

      const configResponse = await fetch(
        `/api/v1/registries/${registryId}/blobs/${encodedRepoPath}/${encodedDigest}`,
        { cache: "no-store" },
      )

      const configPayload = (await configResponse.json()) as ApiResponse<ImageConfig>

      if (!configResponse.ok || !configPayload.success || !configPayload.data) {
        return {
          manifest: manifestPayload.data,
          config: null,
        }
      }

      return {
        manifest: manifestPayload.data,
        config: configPayload.data,
      }
    },
  })
}
