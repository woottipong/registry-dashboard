"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { usePathname } from "next/navigation"

export interface ActivityItem {
  id: string
  type: 'push' | 'pull' | 'delete' | 'connect' | 'view' | 'inspect'
  repository: string
  registry: string
  tag?: string
  user?: string
  timestamp: Date
}

interface ActivityContextType {
  activities: ActivityItem[]
  addActivity: (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => void
  clearActivities: () => void
  isLoading: boolean
}

type StoredActivity = Omit<ActivityItem, 'timestamp'> & { timestamp: string }

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  // Fetch activities from server on mount
  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false)
      return
    }

    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/v1/activities?limit=50')
        const result = await response.json()

        if (result.success) {
          setActivities(result.data)
        } else {
          console.warn('Failed to fetch activities:', result.error)
          // Fall back to localStorage if server fails
          const stored = localStorage.getItem('registry-activities')
          if (stored) {
            const parsedActivities = (JSON.parse(stored) as StoredActivity[]).map((activity) => ({
              ...activity,
              timestamp: new Date(activity.timestamp)
            }))
            setActivities(parsedActivities.slice(0, 50))
          }
        }
      } catch (error) {
        console.warn('Failed to fetch activities from server:', error)
        // Fall back to localStorage
        const stored = localStorage.getItem('registry-activities')
        if (stored) {
          const parsedActivities = (JSON.parse(stored) as StoredActivity[]).map((activity) => ({
            ...activity,
            timestamp: new Date(activity.timestamp)
          }))
          setActivities(parsedActivities.slice(0, 50))
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [isLoginPage])

  // Save activities to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem('registry-activities', JSON.stringify(activities))
    } catch (error) {
      console.warn('Failed to save activities to localStorage:', error)
    }
  }, [activities])

  const optimisticIdCounter = useRef(0)

  const addActivity = useCallback(async (activityData: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    // Use a monotonic counter to guarantee unique optimistic IDs
    const optimisticId = `temp-${Date.now()}-${++optimisticIdCounter.current}`
    const optimisticActivity: ActivityItem = {
      ...activityData,
      id: optimisticId,
      timestamp: new Date()
    }

    setActivities(prev => [optimisticActivity, ...prev.slice(0, 49)])

    try {
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(activityData),
      })

      if (!response.ok) {
        console.warn('Failed to save activity to server:', response.status)
        return
      }

      const result = await response.json()

      if (result.success) {
        setActivities(prev =>
          prev.map(activity =>
            activity.id === optimisticId ? result.data : activity
          )
        )
      } else {
        console.warn('Failed to save activity to server:', result.error)
      }
    } catch (error) {
      console.warn('Failed to send activity to server:', error)
    }
  }, [])

  const clearActivities = useCallback(async () => {
    setActivities([])
    localStorage.removeItem('registry-activities')

    // Note: Server-side clearing would require additional API endpoint
    // For now, we only clear local state
  }, [])

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
