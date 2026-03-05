"use client"

import { useCallback, useEffect, useState } from "react"
import { create } from "zustand"
import { useDebounce } from "@/hooks/use-debounce"
import { createJSONStorage, persist } from "zustand/middleware"

interface CommandPaletteStore {
  open: boolean
  history: string[]
  setOpen: (open: boolean) => void
  addHistory: (query: string) => void
  clearHistory: () => void
}

const useCommandPaletteStore = create<CommandPaletteStore>()(
  persist(
    (set) => ({
      open: false,
      history: [],
      setOpen: (open) => set({ open }),
      addHistory: (query) =>
        set((state) => ({
          history: [query, ...state.history.filter((h) => h !== query)].slice(0, 10),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "registry-dashboard:command-palette",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ history: state.history }),
    },
  ),
)

export function useCommandPalette() {
  const { open, history, setOpen, addHistory, clearHistory } = useCommandPaletteStore()
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, 300)

  // ⌘K / Ctrl+K global shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [setOpen])

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
  }, [setOpen])

  const submitSearch = useCallback(
    (value: string) => {
      if (value.trim()) addHistory(value.trim())
      close()
    },
    [addHistory, close],
  )

  return {
    open,
    setOpen,
    close,
    query,
    setQuery,
    debouncedQuery,
    history,
    submitSearch,
    clearHistory,
  }
}
