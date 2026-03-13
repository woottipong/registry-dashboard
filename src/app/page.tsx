import { ModernDashboardClient } from "./modern-dashboard-client"
import { listRegistries } from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"

export const metadata = {
  title: "Dashboard | Registry UI",
  description: "Overview of your Docker registries and repositories",
}

export default async function DashboardPage() {
  const initialRegistries = listRegistries().map(sanitizeRegistry)

  return <ModernDashboardClient initialRegistries={initialRegistries} />
}
