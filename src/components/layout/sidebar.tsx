"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
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
  const searchParams = useSearchParams()
  const currentRegistryId = searchParams.get("registry")
  const { data: registries, isLoading } = useRegistries()

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

      <div className="px-4 space-y-6 pt-2">
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
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
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
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
              title="Add Registry"
            >
              <PlusIcon className="size-3.5" />
            </Link>
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-none">
            <AnimatePresence mode="popLayout" initial={false}>
              {isLoading ? (
                <div key="loading" className="space-y-2 px-2">
                  <Skeleton className="h-8 w-full rounded-lg bg-muted/50" />
                  <Skeleton className="h-8 w-3/4 rounded-lg bg-muted/50" />
                </div>
              ) : registries && registries.length > 0 ? (
                registries.map((registry: RegistryConnection, index: number) => {
                  const active = pathname.startsWith("/repos") && currentRegistryId === registry.id

                  return (
                    <motion.div
                      key={registry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={`/repos?registry=${registry.id}`}
                        className={cn(
                          "group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200",
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
                    </motion.div>
                  )
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-4 text-[11px] text-center border border-dashed rounded-xl text-muted-foreground/60"
                >
                  Connect your first registry to get started.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-xs font-semibold text-primary mb-1">Docker Helper</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Managing 3 registries with over 100 repositories.
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 size-16 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
        </div>
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
