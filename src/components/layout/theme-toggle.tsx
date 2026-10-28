"use client"

import { MoonStarIcon, SunMediumIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "@/contexts/theme-context"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
}

interface ThemeBackdropProps {
  className?: string
}

const springTransition = {
  type: "spring",
  stiffness: 380,
  damping: 30,
} as const

export function ThemeToggle({ className }: ThemeToggleProps) {
  const mounted = useMounted()
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  function handleToggle() {
    setTheme(isDark ? "light" : "dark")
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          "relative inline-flex h-8 w-16 shrink-0 rounded-full bg-black/5 dark:bg-white/10",
          className,
        )}
      />
    )
  }

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative inline-flex h-8 w-16 shrink-0 cursor-pointer items-center rounded-full bg-black/5 p-1 outline-none transition-colors dark:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      onClick={handleToggle}
    >
      <span className="sr-only">Switch between light and dark mode</span>

      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
        <SunMediumIcon
          className={cn(
            "size-3.5 transition-colors duration-200",
            isDark ? "text-muted-foreground/60" : "text-primary",
          )}
        />
      </span>

      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <MoonStarIcon
          className={cn(
            "size-3.5 transition-colors duration-200",
            isDark ? "text-primary" : "text-muted-foreground/60",
          )}
        />
      </span>

      <motion.span
        className="z-10 flex size-6 items-center justify-center rounded-full bg-card shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
        animate={{ x: isDark ? 32 : 0 }}
        transition={springTransition}
      >
        <span className="flex items-center justify-center">
          {isDark ? (
            <MoonStarIcon className="size-3 text-primary" />
          ) : (
            <SunMediumIcon className="size-3 text-primary" />
          )}
        </span>
      </motion.span>
    </motion.button>
  )
}

export function ThemeBackdrop(_props: ThemeBackdropProps) {
  return null
}
