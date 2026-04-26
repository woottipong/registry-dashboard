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
  stiffness: 320,
  damping: 28,
  mass: 0.72,
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
          "relative inline-flex h-9 w-[4.5rem] shrink-0 rounded-lg border border-border/70 bg-background",
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
        "group relative inline-flex h-9 w-[4.5rem] shrink-0 cursor-pointer items-center rounded-lg border border-border/70 bg-background p-1 outline-none transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-border hover:bg-card focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      onClick={handleToggle}
    >
      <span className="sr-only">Switch between light and dark mode</span>

      <span className="absolute inset-1 rounded-md bg-muted/70" />

      <span className="pointer-events-none absolute inset-y-1 left-2.5 z-0 flex items-center">
        <SunMediumIcon
          className={cn(
            "size-3.5 transition-all duration-200",
            isDark ? "text-muted-foreground/55" : "text-primary",
          )}
        />
      </span>

      <span className="pointer-events-none absolute inset-y-1 right-2.5 z-0 flex items-center">
        <MoonStarIcon
          className={cn(
            "size-3.5 transition-all duration-200",
            isDark ? "text-primary" : "text-muted-foreground/55",
          )}
        />
      </span>

      <motion.span
        className="absolute left-1 top-1 z-10 flex size-7 items-center justify-center rounded-md border border-border/80 bg-card shadow-sm"
        animate={{ x: isDark ? 36 : 0 }}
        transition={springTransition}
      >
        <motion.span
          animate={prefersReducedMotion ? undefined : { rotate: isDark ? 18 : 0, scale: isDark ? 0.98 : 1 }}
          transition={springTransition}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <MoonStarIcon className="size-3.5 text-primary" />
          ) : (
            <SunMediumIcon className="size-3.5 text-primary" />
          )}
        </motion.span>
      </motion.span>
    </motion.button>
  )
}

export function ThemeBackdrop(_props: ThemeBackdropProps) {
  return null
}
