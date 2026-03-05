"use client"

import { useQuery } from "@tanstack/react-query"
import { STALE_TIME_MANIFEST } from "@/lib/query-client"
import { encodeRepoPath } from "@/lib/utils"
import { queryKeys } from "@/lib/constants/query-keys"
import type { ApiResponse } from "@/types/api"
import type { ImageConfig, ImageManifest } from "@/types/manifest"

interface ManifestResult {
  manifest: ImageManifest
  config: ImageConfig | null
}

interface HttpError extends Error {
  status: number
}

export function useManifest(registryId: string, repoName: string, ref: string) {
  return useQuery({
    queryKey: queryKeys.manifests.byRef(registryId, repoName, ref),
    enabled: Boolean(registryId && repoName && ref),
    staleTime: STALE_TIME_MANIFEST,
    retry: false, // Disable retries completely to prevent infinite loops
    retryDelay: 1,
    queryFn: async (): Promise<ManifestResult> => {
      const encodedRepoPath = encodeRepoPath(repoName)
      const encodedRef = encodeURIComponent(ref)

      try {
        const manifestResponse = await fetch(
          `/api/v1/registries/${registryId}/manifests/${encodedRepoPath}/${encodedRef}`,
          { cache: "no-store" },
        )

        if (!manifestResponse.ok) {
          // Create error with status code for retry logic
          const error = new Error(`HTTP ${manifestResponse.status}: ${manifestResponse.statusText}`) as HttpError
          error.status = manifestResponse.status
          throw error
        }

        const manifestPayload = (await manifestResponse.json()) as ApiResponse<ImageManifest>

        if (!manifestPayload.success || !manifestPayload.data) {
          throw new Error(manifestPayload.error?.message ?? "Unable to fetch manifest")
        }

        const digest = manifestPayload.data.config.digest
        const encodedDigest = encodeURIComponent(digest)

        const configResponse = await fetch(
          `/api/v1/registries/${registryId}/blobs/${encodedRepoPath}/${encodedDigest}`,
          { cache: "no-store" },
        )

        if (!configResponse.ok) {
          // Create error with status code for retry logic
          const error = new Error(`HTTP ${configResponse.status}: ${configResponse.statusText}`) as HttpError
          error.status = configResponse.status
          throw error
        }

        const configPayload = (await configResponse.json()) as ApiResponse<ImageConfig>

        if (!configPayload.success || !configPayload.data) {
          return {
            manifest: manifestPayload.data,
            config: null,
          }
        }

        return {
          manifest: manifestPayload.data,
          config: configPayload.data,
        }
      } catch (error) {
        // Ensure error has status for retry logic
        if (!(error as HttpError).status) {
          (error as HttpError).status = 500
        }
        throw error
      }
    },
  })
}
