import { createProvider } from "@/lib/providers"
import type { RegistryConnection } from "@/types/registry"

/**
 * Strip credential values before sending to the client.
 * authType and hasCredentials are enough for the UI;
 * actual secrets must stay server-side.
 */
export function sanitizeRegistry(registry: RegistryConnection) {
  const { credentials, ...rest } = registry
  return {
    ...rest,
    hasCredentials: !!(credentials?.password || credentials?.token),
    capabilities: createProvider(registry).capabilities(),
  }
}

export type SanitizedRegistry = ReturnType<typeof sanitizeRegistry>
