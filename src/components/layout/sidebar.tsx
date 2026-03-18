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
import { Separator } from "@/components/ui/separator"
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
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/repos", label: "Repositories", icon: FolderOpenIcon, exact: false },
  { href: "/registries", label: "Registries", icon: ServerIcon, exact: false },
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
      <div className="border-b border-sidebar-border px-5 py-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Registry" width={36} height={36} className="rounded-xl" />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55">
              Control Plane
            </p>
            <h2 className="truncate text-sm font-semibold tracking-tight">Registry Dashboard</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 py-5">
        <div className="flex flex-col gap-2">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
            Navigation
          </p>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "border-sidebar-primary/25 bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_10px_20px_rgba(37,99,235,0.18)]"
                      : "border-transparent text-sidebar-foreground/68 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-medium">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/45">
              Registries
            </p>
            <Link
              href="/registries/new"
              className="rounded-full border border-transparent p-1.5 text-sidebar-foreground/55 transition-colors hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
              title="Add Registry"
            >
              <PlusIcon className="size-3.5" />
            </Link>
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
                      "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "border-sidebar-primary/20 bg-sidebar-accent text-sidebar-foreground"
                        : "border-transparent text-sidebar-foreground/68 hover:border-sidebar-border hover:bg-sidebar-accent/85 hover:text-sidebar-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold",
                        active
                          ? "border-sidebar-primary bg-sidebar-primary text-sidebar-primary-foreground"
                          : "border-sidebar-border bg-background text-sidebar-foreground/72"
                      )}>
                        {registry.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="rounded-full border border-sidebar-primary/20 bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-primary">
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

      <div className="mt-auto flex items-center justify-between border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/45">
        <span className="uppercase tracking-[0.18em]">Registry OS</span>
        <span className="font-mono tabular-nums text-sidebar-foreground/55">
          {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
        </span>
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
