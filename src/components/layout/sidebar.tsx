"use client"

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
    <div className="flex h-full flex-col bg-sidebar/50 backdrop-blur-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary to-accent opacity-75 blur-[2px]" />
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-sidebar border border-border">
            <ServerIcon className="size-4 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight">Registry Center</h2>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Online</span>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-2 pb-4">
        <div>
          <p className="px-2 mb-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">General</p>
          <nav className="space-y-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                    active
                      ? "text-primary bg-primary/10 border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0 transition-transform group-hover:scale-110 relative z-10", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="relative z-10">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Registries</p>
            <Link
              href="/registries/new"
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
              title="Add Registry"
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {isMounted && isLoading ? (
              <div className="space-y-2 px-2">
                <Skeleton className="h-8 w-full rounded-lg bg-muted/50" />
                <Skeleton className="h-8 w-3/4 rounded-lg bg-muted/50" />
              </div>
            ) : isMounted && registries && registries.length > 0 ? (
              registries.map((registry: RegistryConnection) => {
                const active = pathname.startsWith("/repos") && currentRegistryId === registry.id

                return (
                  <Link
                    key={registry.id}
                    href={`/repos?registry=${registry.id}`}
                    className={cn(
                      "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 cursor-pointer",
                      active
                        ? "bg-primary/5 text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold shrink-0",
                        active ? "bg-primary text-white border-primary" : "bg-sidebar border-border group-hover:border-primary/50"
                      )}>
                        {registry.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 ring-4 ring-primary/5 shrink-0" />
                    )}
                  </Link>
                )
              })
            ) : isMounted ? (
              <div className="px-3 py-2 text-xs text-muted-foreground/60 italic">
                No registries yet
              </div>
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
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-60 lg:border-r lg:border-border lg:bg-background">
        <div className="flex h-full flex-col">
          <SidebarBody />
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 p-0 border-r border-border" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  )
}
