"use client"

import { Suspense } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useUiStore } from "@/stores/ui-store"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Skeleton } from "@/components/ui/skeleton"

interface AppShellProps {
  children: React.ReactNode
}

function SidebarWrapper({ mobileOpen, onMobileOpenChange }: { mobileOpen?: boolean; onMobileOpenChange?: (open: boolean) => void }) {
  return (
    <Suspense fallback={
      <div className="h-full w-[280px] bg-sidebar p-5">
        <Skeleton className="h-8 w-36 rounded-full" />
        <div className="mt-6 flex flex-col gap-2">
          <Skeleton className="h-9 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      </div>
    }>
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
    </Suspense>
  )
}

export function AppShell({ children }: AppShellProps) {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)
  const pathname = usePathname()

  const openPalette = useKeyboardShortcuts()

  // Don't render the shell for login page
  if (pathname === "/login") {
    return (
      <main className="relative min-h-screen bg-background text-foreground">
        <div className="min-h-screen">{children}</div>
      </main>
    )
  }

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <SidebarWrapper mobileOpen={sidebarOpen} onMobileOpenChange={setSidebarOpen} />

      <div className="relative flex min-w-0 flex-1 flex-col lg:ml-[280px]">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} onOpenSearch={() => openPalette(true)} />
        <main className="flex-1 p-4 sm:p-5 lg:px-7 lg:py-5">{children}</main>
      </div>
    </div>
  )
}
