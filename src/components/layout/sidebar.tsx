"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  DatabaseIcon,
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

  const navLinks = [
    { href: "/", label: "Overview", icon: LayoutDashboardIcon, exact: true },
    { href: "/repos", label: "Repositories", icon: FolderOpenIcon, exact: false },
    { href: "/registries", label: "Registry Settings", icon: ServerIcon, exact: false },
  ]

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand Header - 52px height aligning with Topbar */}
      <div className="flex h-[52px] items-center justify-between border-b border-border/70 px-4">
        <Link
          href="/"
          onNavigate={onNavigate}
          className="group flex items-center gap-2.5 rounded-[7px] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] border transition-transform duration-150 group-hover:scale-105 bg-[#1C1C1E] border-white/[0.08]">
            <Image src="/logo.svg" alt="Registry" width={18} height={18} className="rounded-xs" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-[13px] font-semibold tracking-tight text-foreground leading-tight">
              Registry Dashboard
            </span>
            <span className="truncate text-xs text-muted-foreground font-mono leading-none mt-0.5">
              Docker Registry V2
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Rail with calibrated vertical rhythm */}
      <div className="flex flex-1 flex-col gap-6 px-3.5 py-4 overflow-y-auto">
        {/* Main Platform Section */}
        <div className="flex flex-col gap-1.5">
          <p className="px-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {"Main"}
          </p>
          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  onNavigate={onNavigate}
                  className={cn(
                    "group flex items-center justify-between rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "text-foreground font-semibold bg-white/[0.08]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-[#2997FF]" : "text-muted-foreground/80 group-hover:text-foreground",
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Endpoints / Registry Shortcuts Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-2.5 pb-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {"Registry shortcuts"}
            </p>
            <Link
              href="/registries/new"
              onNavigate={onNavigate}
              className="flex size-5 items-center justify-center rounded-[5px] text-muted-foreground transition-colors hover:bg-white/10 hover:text-primary"
              title={"Add registry"}
              aria-label={"Add registry"}
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-1">
            {!isMounted || isLoading ? (
              <div className="flex flex-col gap-1.5 px-1">
                <Skeleton className="h-8 w-full rounded-[6px]" />
                <Skeleton className="h-8 w-3/4 rounded-[6px]" />
              </div>
            ) : registries && registries.length > 0 ? (
              registries.map((registry: RegistryConnection) => {
                const active = pathname.startsWith("/repos") && currentRegistryId === registry.id
                const isDockerHub = registry.provider === "dockerhub"

                return (
                  <Link
                    key={registry.id}
                    href={`/repos?registry=${registry.id}`}
                    onNavigate={onNavigate}
                    className={cn(
                      "group flex items-center justify-between rounded-[7px] px-3 py-2 text-[13px] transition-colors duration-150",
                      active
                        ? "text-foreground font-semibold bg-white/[0.08]"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex flex-1 items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-[5px] text-xs transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground group-hover:text-foreground bg-white/10",
                        )}
                      >
                        {isDockerHub ? <ServerIcon className="size-3" /> : <DatabaseIcon className="size-3" />}
                      </div>
                      <span className="truncate text-xs">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="shrink-0 rounded-[4px] px-1.5 py-0.5 font-mono text-xs text-muted-foreground bg-white/[0.06]">
                        {"Default"}
                      </span>
                    )}
                  </Link>
                )
              })
            ) : (
              <div className="px-1 pt-1">
                <Link
                  href="/registries/new"
                  onNavigate={onNavigate}
                  className="flex items-center gap-2 rounded-[7px] border border-dashed border-border/80 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <PlusIcon className="size-3.5" />
                  <span>{"Add registry"}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border/70 px-6 py-4 text-xs text-muted-foreground">
        Docker Registry V2
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[280px] lg:border-r lg:border-border/70 lg:bg-sidebar">
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
