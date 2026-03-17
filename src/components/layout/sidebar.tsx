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
import { Badge } from "@/components/ui/badge"
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
    <div className="flex h-full flex-col bg-sidebar/82 backdrop-blur-xl">
      <div className="flex items-center gap-3 p-6">
        <Image src="/logo.svg" alt="Registry" width={40} height={40} className="rounded-xl" />
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold tracking-tight">Registry Dashboard</h2>
          <Badge variant="secondary" className="w-fit">Connected</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-4 pb-4">
        <div className="flex flex-col gap-2">
          <p className="px-2 text-xs font-medium text-muted-foreground">Navigation</p>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent/85 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <p className="text-xs font-medium text-muted-foreground">Registries</p>
            <Link
              href="/registries/new"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
                      "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent/85 text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold shrink-0",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                      )}>
                        {registry.name.substring(0, 1).toUpperCase()}
                      </div>
                      <span className="truncate font-medium">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <Badge variant="outline">Default</Badge>
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

      <div className="mt-auto flex items-center justify-between border-t px-6 py-4 text-xs text-muted-foreground">
        <span>Registry Dashboard</span>
        <span className="font-mono tabular-nums">
          {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}
        </span>
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
