"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { makeQueryClient } from "@/lib/query-client"
import { Toaster } from "@/components/ui/sonner"
import { CommandPalette } from "@/components/layout/command-palette"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient per-render on the client side only
  // This avoids sharing state between requests in SSR
  const [queryClient] = useState(() => makeQueryClient())
  const isDevelopment = process.env.NODE_ENV === "development"
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        {children}
        {isLoginPage ? null : <CommandPalette />}
        <Toaster richColors closeButton />
        {isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  )
}
