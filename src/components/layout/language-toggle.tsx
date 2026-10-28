"use client"

import { motion } from "framer-motion"
import { useI18n, type Language } from "@/contexts/i18n-context"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"

const springTransition = {
  type: "spring",
  stiffness: 400,
  damping: 32,
} as const

interface LanguageToggleProps {
  className?: string
}

export function LanguageToggle({ className }: LanguageToggleProps) {
  const mounted = useMounted()
  const { language, setLanguage } = useI18n()

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex h-8 w-16 shrink-0 rounded-full bg-black/5 dark:bg-white/10",
          className,
        )}
      />
    )
  }

  const options: { id: Language; label: string }[] = [
    { id: "en", label: "EN" },
    { id: "th", label: "TH" },
  ]

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={cn(
        "relative inline-flex h-8 shrink-0 items-center rounded-full bg-black/5 p-1 dark:bg-white/10",
        className,
      )}
    >
      {options.map((opt) => {
        const isActive = language === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setLanguage(opt.id)}
            className={cn(
              "relative z-10 flex h-6 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-150 cursor-pointer outline-none",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="active-language-thumb"
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                transition={springTransition}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

