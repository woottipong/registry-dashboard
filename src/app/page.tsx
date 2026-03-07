import { ModernDashboardClient } from "./modern-dashboard-client"
import { listRegistries } from "@/lib/registry-store"
import { createProvider } from "@/lib/providers"
import type { RegistryConnection } from "@/types/registry"

export const metadata = {
  title: "Dashboard | Registry UI",
  description: "Overview of your Docker registries and repositories",
}

// Strip credentials before sending to the client component.
function sanitize(registry: RegistryConnection): RegistryConnection {
  const { credentials, ...rest } = registry
  return {
    ...rest,
    hasCredentials: !!(credentials?.password || credentials?.token),
    capabilities: createProvider(registry).capabilities(),
  }
}

export default async function DashboardPage() {
  const initialRegistries = listRegistries().map(sanitize)

  return <ModernDashboardClient initialRegistries={initialRegistries} />
}
