"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useCommandPalette } from "@/hooks/use-command-palette"

/**
 * Registers global keyboard shortcuts:
 * - ⌘K / Ctrl+K → Open command palette (handled in use-command-palette)
 * - G then R      → Go to /registries
 * - G then D      → Go to / (dashboard)
 * - G then P      → Go to /repos
 * - G then S      → Go to /settings
 *
 * Note: ⌘K / Ctrl+K is already handled inside use-command-palette.
 * This hook adds the "G then *" chord shortcuts.
 */
export function useKeyboardShortcuts() {
  const router = useRouter()
  const { setOpen: openPalette } = useCommandPalette()
  const gPressedRef = useRef(false)
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip when typing in inputs
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // ⌘K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        openPalette(true)
        return
      }

      // G chord shortcuts
      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPressedRef.current = true
        if (gTimerRef.current) clearTimeout(gTimerRef.current)
        // Reset after 800ms if no second key
        gTimerRef.current = setTimeout(() => {
          gPressedRef.current = false
        }, 800)
        return
      }

      if (gPressedRef.current) {
        gPressedRef.current = false
        if (gTimerRef.current) clearTimeout(gTimerRef.current)

        switch (e.key) {
          case "d":
            e.preventDefault()
            router.push("/")
            break
          case "r":
            e.preventDefault()
            router.push("/registries")
            break
          case "p":
            e.preventDefault()
            router.push("/repos")
            break
          case "s":
            e.preventDefault()
            router.push("/settings")
            break
        }
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      if (gTimerRef.current) clearTimeout(gTimerRef.current)
    }
  }, [router, openPalette])
}
