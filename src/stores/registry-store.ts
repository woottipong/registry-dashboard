"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { RegistryConnection } from "@/types/registry"

interface RegistryStoreState {
  registries: RegistryConnection[]
  addRegistry: (registry: RegistryConnection) => void
  updateRegistry: (id: string, changes: Partial<RegistryConnection>) => void
  removeRegistry: (id: string) => void
  setDefault: (id: string) => void
}

const STORAGE_KEY = "registry-dashboard:registry-store"

export const useRegistryStore = create<RegistryStoreState>()(
  persist(
    (set) => ({
      registries: [],
      addRegistry: (registry) =>
        set((state) => ({
          registries: [...state.registries, registry],
        })),
      updateRegistry: (id, changes) =>
        set((state) => ({
          registries: state.registries.map((registry) =>
            registry.id === id
              ? {
                ...registry,
                ...changes,
                updatedAt: new Date().toISOString(),
              }
              : registry,
          ),
        })),
      removeRegistry: (id) =>
        set((state) => ({
          registries: state.registries.filter((registry) => registry.id !== id),
        })),
      setDefault: (id) =>
        set((state) => ({
          registries: state.registries.map((registry) => ({
            ...registry,
            isDefault: registry.id === id,
          })),
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Credentials are managed server-side — never persist them in the browser
      partialize: (state) => ({
        registries: state.registries.map(({ credentials: _, ...rest }) => rest),
      }),
    },
  ),
)
