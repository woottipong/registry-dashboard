"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DatabaseIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ServerIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useRegistries } from "@/hooks/use-registries"
import { Skeleton } from "@/components/ui/skeleton"
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
  const { data: registries, isLoading } = useRegistries()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="p-4 py-5 flex items-center gap-2">
        <ServerIcon className="size-5" />
        <span className="font-medium text-sm">Registry UI</span>
      </div>

      <div className="px-3">
        <p className="px-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">Menu</p>
        <nav className="space-y-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-col flex-1 mt-8 mb-4 px-3 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Connections</p>
          <Link href="/registries/new" className="text-muted-foreground hover:text-foreground transition-colors">
            <PlusIcon className="size-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-1.5 px-2">
            <Skeleton className="h-7 w-full rounded-md" />
            <Skeleton className="h-7 w-3/4 rounded-md" />
          </div>
        ) : registries && registries.length > 0 ? (
          <nav className="space-y-0.5">
            {registries.map((registry: RegistryConnection) => (
              <Link
                key={registry.id}
                href={`/repos?registry=${registry.id}`}
                className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  <DatabaseIcon className="size-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <span className="truncate">{registry.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        ) : (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            No connected registries.
          </div>
        )}
      </div>

    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-60 shrink-0 border-r border-border lg:block z-40 bg-background">
        <SidebarBody />
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
