"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useNotifications } from "@/hooks/use-notifications"

interface BackgroundSyncOptions {
  interval: number // milliseconds
  enabled: boolean
}

interface NotificationResponse {
  hasNotifications: boolean
  message?: string
  tasks?: Array<{
    id: string
    title: string
    type: "reminder" | "overdue" | "new"
    priority: "low" | "medium" | "high"
  }>
  timestamp: number
}

export function useBackgroundSync(options: BackgroundSyncOptions = { interval: 60000, enabled: true }) {
  const [isPolling, setIsPolling] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const { showNotification, settings } = useNotifications()

  const checkForNotifications = useCallback(async () => {
    if (!settings.enabled) return

    try {
      setError(null)
      const response = await fetch("/api/notify", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: NotificationResponse = await response.json()
      setLastCheck(new Date())

      if (data.hasNotifications) {
        // Show notification
        showNotification("Task Manager", {
          body: data.message || "Você tem novas atualizações!",
          tag: "background-sync",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          requireInteraction: true,
          actions: [
            {
              action: "view",
              title: "Ver Tarefas",
            },
            {
              action: "dismiss",
              title: "Dispensar",
            },
          ],
        })

        // If we have specific tasks, show individual notifications
        if (data.tasks && data.tasks.length > 0) {
          data.tasks.forEach((task, index) => {
            setTimeout(() => {
              const typeMessages = {
                reminder: "Lembrete",
                overdue: "Em atraso",
                new: "Nova tarefa",
              }

              showNotification(typeMessages[task.type], {
                body: task.title,
                tag: `task-${task.id}`,
                icon: "/icon-192.png",
                data: { taskId: task.id, type: task.type },
              })
            }, index * 1000) // Stagger notifications by 1 second
          })
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
      setError(errorMessage)
      console.error("Erro ao verificar notificações:", err)
    }
  }, [showNotification, settings.enabled])

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    setIsPolling(true)

    // Check immediately
    checkForNotifications()

    // Set up interval
    intervalRef.current = setInterval(checkForNotifications, options.interval)
  }, [checkForNotifications, options.interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const registerBackgroundSync = useCallback(async () => {
    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("background-sync")
        console.log("Background sync registrado com sucesso")
      } catch (err) {
        console.error("Erro ao registrar background sync:", err)
      }
    }
  }, [])

  useEffect(() => {
    if (options.enabled) {
      startPolling()
      registerBackgroundSync()
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [options.enabled, startPolling, stopPolling, registerBackgroundSync])

  // Handle visibility change - pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else if (options.enabled) {
        startPolling()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [options.enabled, startPolling, stopPolling])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (options.enabled) {
        startPolling()
      }
    }

    const handleOffline = () => {
      stopPolling()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [options.enabled, startPolling, stopPolling])

  return {
    isPolling,
    lastCheck,
    error,
    checkForNotifications,
    startPolling,
    stopPolling,
  }
}
