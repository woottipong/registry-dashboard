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
      <div className="flex h-16 items-center border-b border-border/70 px-4">
        <Link
          href="/"
          onNavigate={onNavigate}
          className="group flex items-center gap-3 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Image
            src="/logo.svg"
            alt="Registry"
            width={30}
            height={30}
            priority
            className="shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                Registry
              </span>
              <span className="rounded bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground leading-none">
                {process.env.NEXT_PUBLIC_APP_VERSION}
              </span>
            </div>
            <span className="truncate text-xs text-muted-foreground leading-none mt-1">
              Dashboard
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Rail */}
      <div className="flex flex-1 flex-col px-3 py-5 overflow-y-auto">
        {/* Primary Destinations */}
        <nav className="flex flex-col gap-1">
          <Link
            href="/"
            onNavigate={onNavigate}
            className={cn(
              "group flex h-9.5 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive("/", true)
                ? "bg-secondary/80 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
            )}
          >
            <LayoutDashboardIcon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                isActive("/", true) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span className="truncate">{"Overview"}</span>
          </Link>

          <Link
            href="/repos"
            onNavigate={onNavigate}
            className={cn(
              "group flex h-9.5 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive("/repos", false)
                ? "bg-secondary/80 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
            )}
          >
            <FolderOpenIcon
              className={cn(
                "size-[18px] shrink-0 transition-colors",
                isActive("/repos", false) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span className="truncate">{"Repositories"}</span>
          </Link>

          <Link
            href="/registries"
            onNavigate={onNavigate}
            className={cn(
              "group flex h-9.5 items-center justify-between rounded-control px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive("/registries", true)
                ? "bg-secondary/80 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ServerIcon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  isActive("/registries", true) ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              <span className="truncate">{"Registries"}</span>
            </div>
            {isMounted && registries && registries.length > 0 && (
              <span className="rounded-control bg-secondary/80 px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                {registries.length}
              </span>
            )}
          </Link>
        </nav>

        {/* Connected Registries Quick Switch */}
        <div className="mt-8 flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{"Connected Registries"}</span>
            <Link
              href="/registries/new"
              onNavigate={onNavigate}
              className="flex size-5 items-center justify-center rounded-control text-muted-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
              title={"Add registry"}
              aria-label={"Add registry"}
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-0.5">
            {!isMounted || isLoading ? (
              <div className="flex flex-col gap-1.5 px-3 pt-1">
                <Skeleton className="h-7 w-full rounded-control" />
                <Skeleton className="h-7 w-3/4 rounded-control" />
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
                      "group flex h-8 items-center justify-between rounded-control px-3 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "bg-secondary/70 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          "size-1.5 rounded-full shrink-0 transition-colors",
                          active ? "bg-primary" : "bg-success",
                        )}
                      />
                      <span className="truncate">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        {"default"}
                      </span>
                    )}
                  </Link>
                )
              })
            ) : null}
          </div>
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
