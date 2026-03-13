"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type RepoViewMode = "grid" | "table"

interface UiStoreState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  repoViewMode: RepoViewMode
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebarCollapsed: () => void
  setRepoViewMode: (mode: RepoViewMode) => void
}

export const useUiStore = create<UiStoreState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      sidebarCollapsed: false,
      repoViewMode: "grid",
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setRepoViewMode: (mode) => set({ repoViewMode: mode }),
    }),
    {
      name: "registry-dashboard:ui-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        repoViewMode: state.repoViewMode,
      }),
    },
  ),
)
