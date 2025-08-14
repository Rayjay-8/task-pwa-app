"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettings {
  enabled: boolean
  taskReminders: boolean
  dailySummary: boolean
  overdueAlerts: boolean
  reminderTime: string // HH:MM format
}

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: Date
  dueDate?: Date
}

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    taskReminders: true,
    dailySummary: true,
    overdueAlerts: true,
    reminderTime: "09:00",
  })
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const { toast } = useToast()

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("notificationSettings")
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }

    // Check current permission
    if ("Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem("notificationSettings", JSON.stringify(settings))
  }, [settings])

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Notificações não suportadas",
        description: "Seu navegador não suporta notificações",
        variant: "destructive",
      })
      return false
    }

    const permission = await Notification.requestPermission()
    setPermission(permission)

    if (permission === "granted") {
      setSettings((prev) => ({ ...prev, enabled: true }))
      toast({
        title: "Notificações ativadas",
        description: "Você receberá notificações sobre suas tarefas",
      })
      return true
    } else {
      toast({
        title: "Permissão negada",
        description: "Ative as notificações nas configurações do navegador",
        variant: "destructive",
      })
      return false
    }
  }, [toast])

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!settings.enabled || permission !== "granted") return

      const notification = new Notification(title, {
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        ...options,
      })

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    },
    [settings.enabled, permission],
  )

  const checkOverdueTasks = useCallback(
    (tasks: Task[]) => {
      if (!settings.overdueAlerts) return

      const now = new Date()
      const overdueTasks = tasks.filter((task) => !task.completed && task.dueDate && task.dueDate < now)

      if (overdueTasks.length > 0) {
        showNotification("Tarefas em atraso!", {
          body: `Você tem ${overdueTasks.length} tarefa(s) em atraso`,
          tag: "overdue-tasks",
          requireInteraction: true,
        })
      }
    },
    [settings.overdueAlerts, showNotification],
  )

  const checkUpcomingTasks = useCallback(
    (tasks: Task[]) => {
      if (!settings.taskReminders) return

      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const upcomingTasks = tasks.filter(
        (task) => !task.completed && task.dueDate && task.dueDate > now && task.dueDate <= tomorrow,
      )

      if (upcomingTasks.length > 0) {
        showNotification("Tarefas próximas do prazo", {
          body: `${upcomingTasks.length} tarefa(s) vencem em breve`,
          tag: "upcoming-tasks",
        })
      }
    },
    [settings.taskReminders, showNotification],
  )

  const sendDailySummary = useCallback(
    (tasks: Task[]) => {
      if (!settings.dailySummary) return

      const pendingTasks = tasks.filter((task) => !task.completed)
      const completedToday = tasks.filter(
        (task) => task.completed && new Date(task.createdAt).toDateString() === new Date().toDateString(),
      )

      showNotification("Resumo diário", {
        body: `${pendingTasks.length} pendentes, ${completedToday.length} concluídas hoje`,
        tag: "daily-summary",
      })
    },
    [settings.dailySummary, showNotification],
  )

  const scheduleNotifications = useCallback(
    (tasks: Task[]) => {
      // Check overdue tasks immediately
      checkOverdueTasks(tasks)

      // Check upcoming tasks
      checkUpcomingTasks(tasks)

      // Schedule daily summary
      const now = new Date()
      const [hours, minutes] = settings.reminderTime.split(":").map(Number)
      const summaryTime = new Date()
      summaryTime.setHours(hours, minutes, 0, 0)

      if (summaryTime <= now) {
        summaryTime.setDate(summaryTime.getDate() + 1)
      }

      const timeUntilSummary = summaryTime.getTime() - now.getTime()
      setTimeout(() => sendDailySummary(tasks), timeUntilSummary)
    },
    [checkOverdueTasks, checkUpcomingTasks, sendDailySummary, settings.reminderTime],
  )

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
  }, [])

  return {
    settings,
    permission,
    requestPermission,
    showNotification,
    scheduleNotifications,
    updateSettings,
    checkOverdueTasks,
    checkUpcomingTasks,
    sendDailySummary,
  }
}
