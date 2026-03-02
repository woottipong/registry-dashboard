"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DatabaseIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ServerIcon,
  SettingsIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex h-full flex-col">
      {/* Main nav */}
      <nav className="space-y-1 px-3 py-4">
        {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
              isActive(href, exact)
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <Separator />

      {/* Registry section */}
      <div className="flex items-center gap-2 px-4 py-3">
        <DatabaseIcon className="size-3.5 text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Registries</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <DatabaseIcon className="size-7 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">No registries added yet</p>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="space-y-1 border-t p-3">
        <Button asChild variant="default" className="w-full justify-start gap-2">
          <Link href="/registries/new">
            <PlusIcon className="size-4" />
            Add Registry
          </Link>
        </Button>
        <Button asChild variant="ghost" className={cn(
          "w-full justify-start gap-2",
          isActive("/settings", true)
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}>
          <Link href="/settings">
            <SettingsIcon className="size-4" />
            Settings
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function Sidebar({ mobileOpen = false, onMobileOpenChange }: SidebarProps) {
  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r bg-card/40 lg:block">
        <SidebarBody />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0 lg:hidden" showCloseButton>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody />
        </SheetContent>
      </Sheet>
    </>
  )
}
