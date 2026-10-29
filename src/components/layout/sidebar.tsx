"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  FolderOpenIcon,
  LayoutDashboardIcon,
  PlusIcon,
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

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRegistryId = pathname.startsWith("/repos/")
    ? pathname.split("/")[2]
    : searchParams.get("registry")
  const { data: registries, isLoading } = useRegistries()
  const isMounted = useMounted()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand header aligned with the topbar */}
      <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
        <Link
          href="/"
          onNavigate={onNavigate}
          className="group flex items-center gap-3 rounded-control transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex size-10 shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-105">
            <Image
              src="/logo.svg"
              alt="Registry"
              width={38}
              height={38}
              priority
              className="shrink-0 drop-shadow-[0_2px_10px_rgba(14,165,233,0.4)]"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-bold tracking-tight text-foreground leading-tight">
                Registry
              </span>
              <span className="rounded-control bg-secondary/80 border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground font-medium">
                v0.1.0
              </span>
            </div>
            <span className="truncate text-xs text-muted-foreground leading-none mt-1">
              Dashboard
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Rail with calibrated vertical rhythm */}
      <div className="flex flex-1 flex-col gap-5 px-3 py-4 overflow-y-auto">
        {/* EXPLORE */}
        <div className="flex flex-col gap-1">
          <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {"Explore"}
          </p>
          <nav className="flex flex-col gap-0.5">
            <Link
              href="/"
              onNavigate={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-control px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive("/", true)
                  ? "text-sidebar-accent-foreground font-semibold bg-sidebar-accent ring-1 ring-inset ring-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutDashboardIcon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive("/", true) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{"Overview"}</span>
              </div>
            </Link>

            <Link
              href="/repos"
              onNavigate={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-control px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive("/repos", false)
                  ? "text-sidebar-accent-foreground font-semibold bg-sidebar-accent ring-1 ring-inset ring-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpenIcon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive("/repos", false) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{"Repositories"}</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* INFRASTRUCTURE */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2.5 pb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {"Infrastructure"}
            </p>
            <Link
              href="/registries/new"
              onNavigate={onNavigate}
              className="flex size-5 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              title={"Add registry"}
              aria-label={"Add registry"}
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <nav className="flex flex-col gap-0.5">
            <Link
              href="/registries"
              onNavigate={onNavigate}
              className={cn(
                "group flex items-center justify-between rounded-control px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive("/registries", true)
                  ? "text-sidebar-accent-foreground font-semibold bg-sidebar-accent ring-1 ring-inset ring-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ServerIcon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive("/registries", true) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{"Registries"}</span>
              </div>
              {isMounted && registries && registries.length > 0 && (
                <span className="rounded-control bg-secondary px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                  {registries.length}
                </span>
              )}
            </Link>

            {/* Individual registry endpoints */}
            {!isMounted || isLoading ? (
              <div className="flex flex-col gap-1.5 px-2.5 pt-1">
                <Skeleton className="h-6 w-full rounded-control" />
                <Skeleton className="h-6 w-3/4 rounded-control" />
              </div>
            ) : registries && registries.length > 0 ? (
              registries.map((registry: RegistryConnection) => {
                const active = pathname.startsWith("/repos") && currentRegistryId === registry.id
                return (
                  <Link
                    key={registry.id}
                    title={registry.name}
                    href={`/repos?registry=${registry.id}`}
                    onNavigate={onNavigate}
                    className={cn(
                      "group flex items-center justify-between rounded-control pl-5 pr-2.5 py-1.5 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "text-sidebar-accent-foreground font-semibold bg-sidebar-accent ring-1 ring-inset ring-primary/25"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-1.5 rounded-full bg-success shrink-0" />
                      <span className="truncate">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="shrink-0 rounded-control bg-secondary/90 border border-border/60 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground font-medium">
                        default
                      </span>
                    )}
                  </Link>
                )
              })
            ) : null}
          </nav>
        </div>
      </div>

      {/* Minimal status indicator */}
      <div className="border-t border-border/70 px-4 py-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>Operational</span>
          </span>
          <span className="text-muted-foreground/60">Docker V2</span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:border-r lg:border-border/70 lg:bg-sidebar">
        <div className="flex h-full flex-col">
          <SidebarBody />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[280px] border-r border-border/70 bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody onNavigate={() => onMobileOpenChange?.(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}
