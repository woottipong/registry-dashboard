"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type ThemePreference = "dark" | "light" | "system"
type RepoViewMode = "grid" | "table"

interface UiStoreState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: ThemePreference
  repoViewMode: RepoViewMode
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setTheme: (theme: ThemePreference) => void
  setRepoViewMode: (mode: RepoViewMode) => void
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      theme: "dark",
      repoViewMode: "grid",
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      setRepoViewMode: (mode) => set({ repoViewMode: mode }),
    }),
    {
      name: "registry-dashboard:ui-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        repoViewMode: state.repoViewMode,
      }),
    },
  ),
)
