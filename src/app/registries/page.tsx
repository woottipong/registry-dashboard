import { ModernRegistriesPage } from "./modern-registries-page"
import { listRegistries } from "@/lib/registry-store"
import { sanitizeRegistry } from "@/lib/registry-sanitizer"

export default async function RegistriesPage() {
  const initialRegistries = listRegistries().map(sanitizeRegistry)

  return <ModernRegistriesPage initialRegistries={initialRegistries} />
}
