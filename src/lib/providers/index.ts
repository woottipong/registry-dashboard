import { DockerHubProvider } from "@/lib/providers/dockerhub-provider"
import { GenericProvider } from "@/lib/providers/generic-provider"
import type { RegistryProvider } from "@/lib/providers/types"
import type { RegistryConnection } from "@/types/registry"

function detectProviderFromUrl(url: string): RegistryConnection["provider"] {
  const lowerUrl = url.toLowerCase()

  if (lowerUrl.includes("registry-1.docker.io") || lowerUrl.includes("docker.io")) {
    return "dockerhub"
  }

  return "generic"
}

export function createProvider(connection: RegistryConnection): RegistryProvider {
  const provider = connection.provider ?? detectProviderFromUrl(connection.url)

  if (provider === "dockerhub") {
    return new DockerHubProvider({ ...connection, provider: "dockerhub" })
  }

  return new GenericProvider({ ...connection, provider: "generic" })
}

export { DockerHubProvider } from "@/lib/providers/dockerhub-provider"
export { GenericProvider } from "@/lib/providers/generic-provider"
export { UnsupportedError } from "@/lib/providers/types"
export type { ListOptions, PaginatedResult, RegistryProvider } from "@/lib/providers/types"
