"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRightIcon, HomeIcon } from "lucide-react"

function formatSegment(segment: string) {
  const decoded = decodeURIComponent(segment)
  return decoded
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    return {
      href,
      label: formatSegment(segment),
      isLast: index === segments.length - 1,
    }
  })

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1 text-sm md:flex">
      <Link
        href="/"
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
      >
        <HomeIcon className="size-4" />
        <span>Home</span>
      </Link>

      {breadcrumbs.map((item) => (
        <div key={item.href} className="inline-flex items-center gap-1">
          <ChevronRightIcon className="size-4 text-muted-foreground" />
          {item.isLast ? (
            <span className="rounded-md px-2 py-1 font-medium text-foreground">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground cursor-pointer"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
