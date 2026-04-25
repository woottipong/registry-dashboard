"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  FolderOpenIcon,
  LayoutDashboardIcon,
  ServerIcon,
} from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useRegistries } from "@/hooks/use-registries"
import { Skeleton } from "@/components/ui/skeleton"
import { useMounted } from "@/hooks/use-mounted"
import type { RegistryConnection } from "@/types/registry"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

const NAV_LINKS = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/repos", label: "Repositories", icon: FolderOpenIcon, exact: false },
  { href: "/registries", label: "Registry Settings", icon: ServerIcon, exact: false },
]

function SidebarBody() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRegistryId = searchParams.get("registry")
  const { data: registries, isLoading } = useRegistries()
  const isMounted = useMounted()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 pb-3 pt-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Registry" width={34} height={34} className="rounded-lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55">
              Registry UI
            </p>
            <h2 className="truncate text-sm font-semibold tracking-tight">Container Images</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-7 px-4 py-5">
        <div className="flex flex-col gap-2.5">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
            Main
          </p>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
              Registry Shortcuts
            </p>
          </div>

          <div className="flex max-h-[300px] flex-col gap-1 overflow-y-auto">
            {isMounted && isLoading ? (
              <div className="flex flex-col gap-2 px-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-3/4 rounded-lg" />
              </div>
            ) : isMounted && registries && registries.length > 0 ? (
              registries.map((registry: RegistryConnection) => {
                const active = pathname.startsWith("/repos") && currentRegistryId === registry.id

                return (
                  <Link
                    key={registry.id}
                    href={`/repos?registry=${registry.id}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/68 hover:bg-sidebar-accent/85 hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[10px] font-bold",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "bg-background text-sidebar-foreground/72"
                      )}>
                        {registry.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="rounded-md bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-primary">
                        Default
                      </span>
                    )}
                  </Link>
                )
              })
            ) : isMounted ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No registries yet
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-auto px-4 pb-4">
        <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/55 px-3 py-2.5 text-[11px] text-sidebar-foreground/50">
          <span className="uppercase tracking-[0.18em]">Version</span>
          <span className="font-mono tabular-nums text-sidebar-foreground/60">
            {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
          </span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:border-r lg:border-sidebar-border lg:bg-sidebar">
        <div className="flex h-full flex-col">
          <SidebarBody />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 border-r border-sidebar-border bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  )
}
