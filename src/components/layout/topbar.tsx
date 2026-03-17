"use client"

import { Suspense, useState } from "react"
import { MenuIcon, LogOutIcon, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Breadcrumbs } from "@/components/layout/breadcrumbs"
import { ThemeToggle } from "@/components/layout/theme-toggle"
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
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-sidebar">
      <div className="flex h-full items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-primary/5"
            onClick={onOpenSidebar}
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </Button>

          <div className="hidden md:block">
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-[1px] bg-border mx-2" />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="User menu"
                className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent p-[1px] hidden sm:flex"
              >
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                  <UserIcon className="size-4 text-primary" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Logged in
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
