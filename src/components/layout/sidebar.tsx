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
import { useI18n } from "@/contexts/i18n-context"
import type { RegistryConnection } from "@/types/registry"

interface SidebarProps {
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

function SidebarBody() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentRegistryId = searchParams.get("registry")
  const { data: registries, isLoading } = useRegistries()
  const { t } = useI18n()

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  const navLinks = [
    { href: "/", label: t("nav.overview", "Overview"), icon: LayoutDashboardIcon, exact: true },
    { href: "/repos", label: t("nav.repositories", "Repositories"), icon: FolderOpenIcon, exact: false },
    { href: "/registries", label: t("nav.settings", "Registry Settings"), icon: ServerIcon, exact: false },
  ]

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand Header - 52px height aligning with Topbar */}
      <div className="flex h-[52px] items-center justify-between border-b border-border/70 px-3.5">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-[7px] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-white dark:bg-[#1C1C1E] shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-black/[0.06] dark:border-white/[0.08] transition-transform duration-150 group-hover:scale-105">
            <Image src="/logo.svg" alt="Registry" width={18} height={18} className="rounded-xs" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-[13px] font-semibold tracking-tight text-foreground leading-tight">
              Registry Dashboard
            </span>
            <span className="truncate text-[10px] text-muted-foreground font-mono leading-none mt-0.5">
              Docker Registry V2
            </span>
          </div>
        </Link>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span>Live</span>
        </div>
      </div>

      {/* Navigation Rail */}
      <div className="flex flex-1 flex-col gap-5 px-3 py-3.5 overflow-y-auto">
        {/* Main Platform Section */}
        <div className="flex flex-col gap-1">
          <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {t("nav.main", "Platform")}
          </p>
          <nav className="flex flex-col gap-0.5">
            {navLinks.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
                    active
                      ? "bg-black/[0.06] dark:bg-white/[0.08] text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-black/[0.035] dark:hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-[#0071E3] dark:text-[#2997FF]" : "text-muted-foreground/80 group-hover:text-foreground",
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
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t("nav.shortcuts", "Endpoints")}
            </p>
            <Link
              href="/registries/new"
              className="flex size-5 items-center justify-center rounded-[5px] text-muted-foreground/70 transition-colors hover:bg-black/5 hover:text-primary dark:hover:bg-white/10 dark:hover:text-primary"
              title={t("nav.addRegistry", "Add registry")}
              aria-label={t("nav.addRegistry", "Add registry")}
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-0.5">
            {isLoading ? (
              <div className="flex flex-col gap-1 px-1">
                <Skeleton className="h-7 w-full rounded-[6px]" />
                <Skeleton className="h-7 w-3/4 rounded-[6px]" />
              </div>
            ) : registries && registries.length > 0 ? (
              registries.map((registry: RegistryConnection) => {
                const active = pathname.startsWith("/repos") && currentRegistryId === registry.id
                const isDockerHub = registry.provider === "dockerhub"

                return (
                  <Link
                    key={registry.id}
                    href={`/repos?registry=${registry.id}`}
                    className={cn(
                      "group flex items-center justify-between rounded-[7px] px-2.5 py-1.5 text-[13px] transition-colors duration-150",
                      active
                        ? "bg-black/[0.06] dark:bg-white/[0.08] text-foreground font-semibold"
                        : "text-muted-foreground hover:bg-black/[0.035] dark:hover:bg-white/[0.04] hover:text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-[5px] text-[10px] transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "bg-black/[0.04] dark:bg-white/10 text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {isDockerHub ? <ServerIcon className="size-3" /> : <DatabaseIcon className="size-3" />}
                      </div>
                      <span className="truncate text-xs">{registry.name}</span>
                    </div>
                    {registry.isDefault && (
                      <span className="rounded-[4px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground">
                        Default
                      </span>
                    )}
                  </Link>
                )
              })
            ) : (
              <div className="px-1 pt-1">
                <Link
                  href="/registries/new"
                  className="flex items-center gap-2 rounded-[7px] border border-dashed border-border/80 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <PlusIcon className="size-3.5" />
                  <span>{t("nav.addRegistry", "Connect registry")}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Dock Footer */}
      <div className="mt-auto border-t border-border/70 p-3 pb-12">
        <div className="flex items-center justify-between rounded-[8px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] px-2.5 py-1.5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-muted-foreground">
              {t("nav.systemLive", "System Operational")}
            </span>
          </div>
          <span className="rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground/80 bg-black/[0.04] dark:bg-white/[0.06]">
            V2 API
          </span>
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
        <SheetContent side="left" className="w-64 border-r border-border/70 bg-sidebar p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  )
}
