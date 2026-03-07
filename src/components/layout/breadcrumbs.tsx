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
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(decoded)) return decoded
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

  const isReposRoot = pathname === "/repos"
  // /repos/[registryId]/[...repoName] — the tag explorer route
  const isRepoDetail = segments[0] === "repos" && segments.length >= 3

  let allItems: BreadcrumbItem[] = []

  if (isReposRoot) {
    // ── /repos — namespace overview page ──────────────────────────────────
    // Query params only read client-side to avoid hydration mismatch
    const registryParam = isMounted ? searchParams.get("registry") : null
    const namespaceParam = isMounted ? searchParams.get("namespace") : null

    allItems = [
      {
        href: "/repos",
        label: "Repositories",
        isLast: !registryParam,
      },
    ]

    if (registryParam && registries) {
      const registry = registries.find((r) => r.id === registryParam)
      if (registry) {
        allItems.push({
          href: `/repos?registry=${registryParam}`,
          label: registry.name,
          isLast: !namespaceParam,
        })
      }
      if (namespaceParam) {
        const displayNs = namespaceParam === "_root" ? "(root)" : namespaceParam
        allItems.push({
          href: `/repos?registry=${registryParam}&namespace=${namespaceParam}`,
          label: displayNs,
          isLast: true,
        })
      }
    }
  } else if (isRepoDetail) {
    // ── /repos/[registryId]/[...repoName] — tag explorer ─────────────────
    // segments: ['repos', registryId, ...repoNameParts]
    // Registry and namespace must link back to query-param based /repos URLs
    const registryId = segments[1]
    const repoNameParts = segments.slice(2)

    allItems = [
      { href: "/repos", label: "Repositories", isLast: false },
    ]

    // Registry segment → /repos?registry=<id>
    const registry = registries?.find((r) => r.id === registryId)
    allItems.push({
      href: `/repos?registry=${registryId}`,
      label: registry?.name ?? formatSegment(registryId),
      isLast: repoNameParts.length === 0,
    })

    if (repoNameParts.length >= 2) {
      // Namespace = everything except the last segment of the repo name
      const namespaceParts = repoNameParts.slice(0, -1)
      const namespace = namespaceParts.join("/")
      allItems.push({
        href: `/repos?registry=${registryId}&namespace=${encodeURIComponent(namespace)}`,
        label: formatSegment(namespace),
        isLast: false,
      })
    }

    if (repoNameParts.length >= 1) {
      // Last segment = the repo name itself (current page — no link)
      allItems.push({
        href: pathname,
        label: formatSegment(repoNameParts[repoNameParts.length - 1]),
        isLast: true,
      })
    }
  } else {
    // ── All other paths: /registries, /registries/[id]/edit, etc. ─────────
    allItems = segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`
      const isLast = index === segments.length - 1

      if (PATH_LABELS[segment]) {
        return { href, label: PATH_LABELS[segment], isLast }
      }

      if (segments[index - 1] === "registries" && registries) {
        const registry = registries.find((r) => r.id === segment)
        if (registry) {
          return { href, label: registry.name, isLast }
        }
      }

      return { href, label: formatSegment(segment), isLast }
    })
  }

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
