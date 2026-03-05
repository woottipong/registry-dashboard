"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

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

  // Fetch activities from server on mount
  useEffect(() => {
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
  }, [])

  // Save activities to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem('registry-activities', JSON.stringify(activities))
    } catch (error) {
      console.warn('Failed to save activities to localStorage:', error)
    }
  }, [activities])

  const addActivity = useCallback(async (activityData: Omit<ActivityItem, 'id' | 'timestamp'>) => {
    // Optimistically add to local state first
    const optimisticActivity: ActivityItem = {
      ...activityData,
      id: `temp-${Date.now()}`,
      timestamp: new Date()
    }

    setActivities(prev => [optimisticActivity, ...prev.slice(0, 49)])

    try {
      // Send to server
      const response = await fetch('/api/v1/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      })

      const result = await response.json()

      if (result.success) {
        // Replace optimistic activity with server response
        setActivities(prev =>
          prev.map(activity =>
            activity.id === optimisticActivity.id ? result.data : activity
          )
        )
      } else {
        console.warn('Failed to save activity to server:', result.error)
        // Keep optimistic activity if server fails
      }
    } catch (error) {
      console.warn('Failed to send activity to server:', error)
      // Keep optimistic activity if network fails
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
