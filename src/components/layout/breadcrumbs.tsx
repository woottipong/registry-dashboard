"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { ChevronRightIcon, HomeIcon } from "lucide-react"
import { useRegistries } from "@/hooks/use-registries"
import { useMounted } from "@/hooks/use-mounted"

// Known static path labels
const PATH_LABELS: Record<string, string> = {
  repos: "Repositories",
  registries: "Registries",
  new: "New",
  settings: "Settings",
}

function formatSegment(segment: string): string {
  const decoded = decodeURIComponent(segment)
  // If it looks like a UUID, don't try to format it (will be replaced by registry name lookup)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(decoded)) return decoded
  // Replace underscores with spaces, capitalize words
  return decoded
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

interface BreadcrumbItem {
  href: string
  label: string
  isLast: boolean
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: registries } = useRegistries()
  const isMounted = useMounted()

  const segments = pathname.split("/").filter(Boolean)

  // Build breadcrumb items with smart label resolution
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const isLast = index === segments.length - 1

    // Static known labels
    if (PATH_LABELS[segment]) {
      return { href, label: PATH_LABELS[segment], isLast }
    }

    // Registry ID segment inside /repos/[registryId]/... — resolve name
    if (segments[index - 1] === "repos" && registries) {
      const registry = registries.find((r) => r.id === segment)
      if (registry) {
        return { href, label: registry.name, isLast }
      }
    }

    // Registry ID segment inside /registries/[registryId]/... — resolve name
    if (segments[index - 1] === "registries" && registries) {
      const registry = registries.find((r) => r.id === segment)
      if (registry) {
        return { href, label: registry.name, isLast }
      }
    }

    // Repo name segments — join remaining path as the repo display name
    return { href, label: formatSegment(segment), isLast }
  })

  // When on /repos with ?registry= query param, append registry name as context
  // Only read after mount to avoid SSR/client hydration mismatch
  const registryParam = isMounted ? searchParams.get("registry") : null
  const namespaceParam = isMounted ? searchParams.get("namespace") : null
  const isReposRoot = pathname === "/repos"

  const contextCrumbs: BreadcrumbItem[] = []

  if (isReposRoot && registryParam && registries) {
    const registry = registries.find((r) => r.id === registryParam)
    if (registry) {
      contextCrumbs.push({
        href: `/repos?registry=${registryParam}`,
        label: registry.name,
        isLast: !namespaceParam,
      })
    }
    if (namespaceParam) {
      const displayNs = namespaceParam === "_root" ? "(root)" : namespaceParam
      contextCrumbs.push({
        href: `/repos?registry=${registryParam}&namespace=${namespaceParam}`,
        label: displayNs,
        isLast: true,
      })
    }
  }

  const allItems = [...items.map((i) => ({ ...i, isLast: contextCrumbs.length === 0 ? i.isLast : false })), ...contextCrumbs]

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
      >
        <HomeIcon className="size-4" />
        <span>Home</span>
      </Link>

      {allItems.map((item, i) => (
        <div key={`${item.href}-${i}`} className="inline-flex items-center gap-1">
          <ChevronRightIcon className="size-4 text-muted-foreground" />
          {item.isLast ? (
            <span className="rounded-md px-2 py-1 font-medium text-foreground truncate max-w-[200px]">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer truncate max-w-[160px]"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
