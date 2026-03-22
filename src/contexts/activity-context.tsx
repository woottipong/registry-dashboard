"use client"

import React, { createContext, useContext, useCallback } from 'react'
import { usePathname } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/constants/query-keys"
import { assertApiSuccess } from "@/lib/error-handling"

export interface ActivityItem {
  id: string
  type: 'push' | 'pull' | 'delete' | 'connect' | 'view' | 'inspect'
  repository: string
  registry: string
  tag?: string
  user?: string
  timestamp: string
}

interface ActivityContextType {
  activities: ActivityItem[]
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void
  clearActivities: () => void
  isLoading: boolean
}

function getLocalStorageFallback(): ActivityItem[] {
  try {
    const stored = localStorage.getItem('registry-activities')
    if (stored) return (JSON.parse(stored) as ActivityItem[]).slice(0, 50)
  } catch {
    // localStorage may be unavailable
  }
  return []
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"
  const queryClient = useQueryClient()

  const { data: activities = [], isLoading } = useQuery({
    queryKey: queryKeys.activities.all,
    enabled: !isLoginPage,
    staleTime: 30_000,
    placeholderData: getLocalStorageFallback,
    queryFn: async () => {
      const response = await fetch('/api/v1/activities?limit=50')
      const data = await assertApiSuccess<ActivityItem[]>(response)
      try {
        localStorage.setItem('registry-activities', JSON.stringify(data))
      } catch {
        // localStorage may be unavailable
      }
      return data
    },
  })

  const mutation = useMutation({
    mutationFn: async (activityData: Omit<ActivityItem, 'id' | 'timestamp'>) => {
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(activityData),
      })
      return assertApiSuccess<ActivityItem>(response)
    },
    onMutate: async (activityData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.activities.all })
      const previous = queryClient.getQueryData<ActivityItem[]>(queryKeys.activities.all)

      const optimistic: ActivityItem = {
        ...activityData,
        id: `temp-${Date.now()}`,
        timestamp: new Date().toISOString(),
      }

      queryClient.setQueryData<ActivityItem[]>(
        queryKeys.activities.all,
        (old = []) => [optimistic, ...old.slice(0, 49)],
      )

      return { previous, optimisticId: optimistic.id }
    },
    onSuccess: (saved, _variables, context) => {
      queryClient.setQueryData<ActivityItem[]>(
        queryKeys.activities.all,
        (old = []) => old.map(a => a.id === context?.optimisticId ? saved : a),
      )
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.activities.all, context.previous)
      }
    },
  })

  const addActivity = useCallback(
    (activityData: Omit<ActivityItem, 'id' | 'timestamp'>) => {
      mutation.mutate(activityData)
    },
    [mutation],
  )

  const clearActivities = useCallback(() => {
    queryClient.setQueryData(queryKeys.activities.all, [])
    localStorage.removeItem('registry-activities')
  }, [queryClient])

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities, isLoading }}>
      {children}
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const context = useContext(ActivityContext)
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider')
  }
  return context
}
