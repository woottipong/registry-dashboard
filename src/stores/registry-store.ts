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
const ENCRYPTION_KEY = "registry-dashboard-local-key"

function xorCipher(value: string, key: string): string {
  const transformed = Array.from(value)
    .map((char, index) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length)),
    )
    .join("")

  return transformed
}

function encode(value: string): string {
  if (typeof window === "undefined") {
    return value
  }

  return window.btoa(xorCipher(value, ENCRYPTION_KEY))
}

function decode(value: string): string {
  if (typeof window === "undefined") {
    return value
  }

  try {
    return xorCipher(window.atob(value), ENCRYPTION_KEY)
  } catch {
    return value
  }
}

const encryptedStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") {
      return null
    }

    const encrypted = window.localStorage.getItem(name)
    if (!encrypted) {
      return null
    }

    return decode(encrypted)
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(name, encode(value))
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.removeItem(name)
  },
}

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
      storage: createJSONStorage(() => encryptedStorage),
    },
  ),
)
