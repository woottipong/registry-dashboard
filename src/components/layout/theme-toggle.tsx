"use client"

import { MoonStarIcon, SunMediumIcon } from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
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
          "relative inline-flex h-10 w-[4.9rem] shrink-0 rounded-full border border-border/70 bg-card/80 shadow-sm backdrop-blur-md",
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
        "group relative inline-flex h-10 w-[4.9rem] shrink-0 cursor-pointer items-center rounded-full border border-border/70 bg-card/85 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md outline-none transition-[border-color,box-shadow,transform] duration-300 hover:border-border focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-card/75 dark:shadow-[0_10px_28px_rgba(0,0,0,0.28)]",
        className,
      )}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
      onClick={handleToggle}
    >
      <span className="sr-only">Switch between light and dark mode</span>

      <span className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_86%,white_14%)_0%,color-mix(in_srgb,var(--muted)_80%,transparent)_100%)] dark:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_88%,white_12%)_0%,color-mix(in_srgb,var(--secondary)_82%,transparent)_100%)]" />

      <span className="pointer-events-none absolute inset-y-1 left-2.5 z-0 flex items-center">
        <SunMediumIcon
          className={cn(
            "size-4 transition-all duration-300",
            isDark ? "text-muted-foreground/55 opacity-60" : "text-chart-3 opacity-100",
          )}
        />
      </span>

      <span className="pointer-events-none absolute inset-y-1 right-2.5 z-0 flex items-center">
        <MoonStarIcon
          className={cn(
            "size-4 transition-all duration-300",
            isDark ? "text-primary opacity-100" : "text-muted-foreground/55 opacity-60",
          )}
        />
      </span>

      <motion.span
        className="absolute left-1 top-1 z-10 flex size-8 items-center justify-center rounded-full border border-border/80 bg-background/95 shadow-[0_4px_14px_rgba(15,23,42,0.12)] dark:bg-background/90"
        animate={{ x: isDark ? 38 : 0 }}
        transition={springTransition}
      >
        <motion.span
          animate={prefersReducedMotion ? undefined : { rotate: isDark ? 18 : 0, scale: isDark ? 0.98 : 1 }}
          transition={springTransition}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <MoonStarIcon className="size-4 text-primary" />
          ) : (
            <SunMediumIcon className="size-4 text-chart-3" />
          )}
        </motion.span>
      </motion.span>
    </motion.button>
  )
}

export function ThemeBackdrop(_props: ThemeBackdropProps) {
  return null
}
