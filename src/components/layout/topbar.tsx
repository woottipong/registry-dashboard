"use client"

import { Suspense, useState } from "react"
import { MenuIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageToggle } from "@/components/layout/language-toggle"
import { logout } from "@/lib/logout"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TopbarProps {
  onOpenSidebar: () => void
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await logout({
        onLoggedOut: () => window.location.replace("/login"),
        onFailedRefresh: () => router.refresh(),
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-30 h-[52px] border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <MenuIcon className="size-4" />
          </Button>

          <div className="min-w-0">
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
                className="hidden size-8 rounded-full sm:flex"
              >
                <UserIcon className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-lg">
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    System access
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="rounded-lg">
                <LogOutIcon data-icon="inline-start" className="size-4" />
                <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
