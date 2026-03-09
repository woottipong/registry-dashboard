"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useTheme } from "next-themes"
import { useMounted } from "@/hooks/use-mounted"
import { cn } from "@/lib/utils"
import { useUiStore } from "@/stores/ui-store"

interface ThemeToggleProps {
    className?: string
}

interface ThemeBackdropProps {
    className?: string
}

const springTransition = {
    type: "spring",
    stiffness: 280,
    damping: 24,
    mass: 0.8,
} as const

const toggleStars = [
    { left: "18%", top: "26%", size: 4, delay: 0.1 },
    { left: "28%", top: "42%", size: 3, delay: 0.35 },
    { left: "40%", top: "20%", size: 5, delay: 0.7 },
    { left: "72%", top: "28%", size: 3, delay: 0.2 },
    { left: "82%", top: "42%", size: 4, delay: 0.55 },
]

const backdropStars = [
    { left: "9%", top: "14%", size: 5, delay: 0.1 },
    { left: "18%", top: "32%", size: 3, delay: 0.7 },
    { left: "31%", top: "18%", size: 4, delay: 1.1 },
    { left: "47%", top: "10%", size: 3, delay: 0.5 },
    { left: "59%", top: "26%", size: 4, delay: 1.6 },
    { left: "70%", top: "16%", size: 5, delay: 0.2 },
    { left: "82%", top: "22%", size: 3, delay: 0.95 },
    { left: "90%", top: "12%", size: 4, delay: 1.35 },
]

function Star({ left, top, size, delay, subtle = false }: { left: string; top: string; size: number; delay: number; subtle?: boolean }) {
    const prefersReducedMotion = useReducedMotion()

    return (
        <motion.span
            className="absolute rounded-full bg-white"
            style={{
                left,
                top,
                width: size,
                height: size,
                boxShadow: subtle ? "0 0 10px rgba(255,255,255,0.35)" : "0 0 14px rgba(255,255,255,0.55)",
            }}
            animate={prefersReducedMotion ? undefined : { opacity: [0.4, 1, 0.55], scale: [1, 1.35, 1] }}
            transition={prefersReducedMotion ? undefined : { duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay }}
        />
    )
}

function Cloud({ className }: { className?: string }) {
    return (
        <div className={cn("relative h-5 w-10", className)}>
            <span className="absolute bottom-0 left-0 h-3.5 w-6 rounded-full bg-white/88" />
            <span className="absolute bottom-1 left-2.5 h-4.5 w-4.5 rounded-full bg-white" />
            <span className="absolute bottom-0 right-0 h-3.5 w-5 rounded-full bg-white/94" />
        </div>
    )
}

function SunGlyph({ isDark }: { isDark: boolean }) {
    const prefersReducedMotion = useReducedMotion()

    return (
        <motion.div
            className="relative flex h-5 w-5 items-center justify-center"
            animate={prefersReducedMotion ? undefined : { rotate: isDark ? 0 : 180 }}
            transition={prefersReducedMotion ? undefined : { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
            <span className="absolute inset-0 rounded-full bg-[#f3c84d]" />
            <span className="absolute left-1/2 top-0 h-1 w-0.5 -translate-x-1/2 rounded-full bg-[#f3c84d]" />
            <span className="absolute bottom-0 left-1/2 h-1 w-0.5 -translate-x-1/2 rounded-full bg-[#f3c84d]" />
            <span className="absolute left-0 top-1/2 h-0.5 w-1 -translate-y-1/2 rounded-full bg-[#f3c84d]" />
            <span className="absolute right-0 top-1/2 h-0.5 w-1 -translate-y-1/2 rounded-full bg-[#f3c84d]" />
            <span className="absolute left-[5px] top-[5px] h-0.5 w-1 -rotate-45 rounded-full bg-[#f3c84d]" />
            <span className="absolute right-[5px] top-[5px] h-0.5 w-1 rotate-45 rounded-full bg-[#f3c84d]" />
            <span className="absolute bottom-[5px] left-[5px] h-0.5 w-1 rotate-45 rounded-full bg-[#f3c84d]" />
            <span className="absolute bottom-[5px] right-[5px] h-0.5 w-1 -rotate-45 rounded-full bg-[#f3c84d]" />
        </motion.div>
    )
}

function MoonGlyph() {
    return (
        <div className="relative h-5 w-5">
            <span className="absolute inset-0 rounded-full bg-[#dbe1f8]" />
            <span className="absolute right-[-1px] top-[2px] h-5 w-5 rounded-full bg-[#7f92c8]/58" />
            <span className="absolute left-[5px] top-[6px] h-1 w-1 rounded-full bg-[#b7c6eb]" />
            <span className="absolute bottom-[5px] left-[8px] h-1 w-1 rounded-full bg-[#b7c6eb]/80" />
        </div>
    )
}

function ThemeScene({ isDark }: { isDark: boolean }) {
    const prefersReducedMotion = useReducedMotion()

    return (
        <>
            <motion.div
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#8ebedd_0%,#c9dfef_48%,#ecd9a8_100%)]"
                animate={{ opacity: isDark ? 0 : 1, scale: isDark ? 0.98 : 1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
                className="absolute inset-0 rounded-full bg-[linear-gradient(135deg,#040b18_0%,#10203f_48%,#0a1328_100%)]"
                animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 1.02 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
                className="absolute left-2 top-2 h-4.5 w-4.5 rounded-full bg-[#f3c84d]"
                animate={{ x: isDark ? 10 : 0, y: isDark ? -8 : 0, opacity: isDark ? 0 : 1, scale: isDark ? 0.7 : 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.div
                className="absolute right-3 top-2 h-4.5 w-4.5 rounded-full bg-[#d9e0f6]"
                animate={{ x: isDark ? 0 : 10, y: isDark ? 0 : -8, opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0.7 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <span className="absolute right-[-1px] top-[1px] h-4 w-4 rounded-full bg-[#7f92c8]/60" />
            </motion.div>

            <motion.div
                className="absolute bottom-2.5 left-2.5"
                animate={prefersReducedMotion ? { opacity: isDark ? 0 : 1 } : { x: isDark ? -10 : 0, y: isDark ? 6 : 0, opacity: isDark ? 0 : 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
                <Cloud />
            </motion.div>

            <motion.div
                className="absolute bottom-2 right-4 scale-[0.82]"
                animate={prefersReducedMotion ? { opacity: isDark ? 0 : 0.88 } : { x: isDark ? 14 : 0, y: isDark ? 8 : 0, opacity: isDark ? 0 : 0.88 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.04 }}
            >
                <Cloud />
            </motion.div>

            <motion.div
                className="absolute inset-0"
                animate={{ opacity: isDark ? 1 : 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
            >
                {toggleStars.map((star) => (
                    <Star key={`${star.left}-${star.top}`} {...star} />
                ))}
            </motion.div>
        </>
    )
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const mounted = useMounted()
    const prefersReducedMotion = useReducedMotion()
    const { resolvedTheme, setTheme } = useTheme()
    const setThemePreference = useUiStore((state) => state.setTheme)
    const isDark = mounted ? resolvedTheme === "dark" : true

    const handleToggle = () => {
        const nextTheme = isDark ? "light" : "dark"
        setTheme(nextTheme)
        setThemePreference(nextTheme)
    }

    return (
        <motion.button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle dark mode"
            className={cn(
                "group relative inline-flex h-9 w-[4.9rem] shrink-0 items-center rounded-full border border-white/30 bg-white/10 p-1 backdrop-blur-xl outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/10 dark:bg-white/[0.03]",
                className,
            )}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
            onClick={handleToggle}
        >
            <span className="sr-only">Switch between light and dark mode</span>

            <div className="absolute inset-0 overflow-hidden rounded-full">
                <ThemeScene isDark={isDark} />
            </div>

            <motion.div
                className="absolute inset-y-1 left-1 z-10 flex w-7 items-center justify-center rounded-full border border-white/55 bg-white/72 backdrop-blur-md dark:border-white/10 dark:bg-[#09101dcc]"
                animate={{ x: isDark ? 42 : 0 }}
                transition={springTransition}
            >
                <motion.div
                    className="relative flex h-5 w-5 items-center justify-center"
                    animate={{ rotate: isDark ? -18 : 0 }}
                    transition={springTransition}
                >
                    <motion.div
                        className="absolute"
                        animate={{ opacity: isDark ? 0 : 1, scale: isDark ? 0.72 : 1 }}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                    >
                        <SunGlyph isDark={isDark} />
                    </motion.div>
                    <motion.div
                        className="absolute"
                        animate={{ opacity: isDark ? 1 : 0, scale: isDark ? 1 : 0.72 }}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                    >
                        <MoonGlyph />
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.button>
    )
}

export function ThemeBackdrop({ className }: ThemeBackdropProps) {
    const mounted = useMounted()
    const { resolvedTheme } = useTheme()
    const isDark = mounted ? resolvedTheme === "dark" : true

    return (
        <div aria-hidden="true" className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}>
            <motion.div
                className="absolute inset-0"
                animate={{ opacity: isDark ? 0 : 1 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,236,163,0.85),_transparent_28%),linear-gradient(180deg,_#cfeeff_0%,_#e8f7ff_42%,_#f6f4fb_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(227,211,164,0.42),_transparent_24%),linear-gradient(180deg,_#d8e7f0_0%,_#e7eef3_42%,_#ece8ee_100%)]" />
                <div className="absolute inset-x-0 top-[-18%] h-[48%] bg-[radial-gradient(circle_at_center,_rgba(222,190,111,0.18),_transparent_58%)] blur-3xl" />
                <div className="absolute left-[-8%] top-[16%] h-40 w-40 rounded-full bg-white/28 blur-3xl" />
                <div className="absolute right-[8%] top-[22%] h-52 w-52 rounded-full bg-[#dbc59b]/18 blur-3xl" />
                <div className="absolute bottom-[10%] left-[12%] h-24 w-56 rounded-full bg-white/18 blur-2xl" />
            </motion.div>

            <motion.div
                className="absolute inset-0"
                animate={{ opacity: isDark ? 1 : 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(57,79,171,0.16),_transparent_24%),linear-gradient(180deg,_#040811_0%,_#060c18_38%,_#04060b_100%)]" />
                <div className="absolute left-[8%] top-[12%] h-56 w-56 rounded-full bg-[#152755]/22 blur-3xl" />
                <div className="absolute right-[-4%] top-[8%] h-72 w-72 rounded-full bg-[#1a2862]/16 blur-3xl" />
                <div className="absolute bottom-[-10%] left-[20%] h-64 w-64 rounded-full bg-[#101739]/24 blur-3xl" />
                {backdropStars.map((star) => (
                    <Star key={`backdrop-${star.left}-${star.top}`} {...star} subtle />
                ))}
            </motion.div>
        </div>
    )
}