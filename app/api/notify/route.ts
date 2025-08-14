import { NextResponse } from "next/server"

interface NotificationData {
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

// Simulated notification data - in a real app, this would come from a database
const notificationQueue: NotificationData[] = []

export async function GET() {
  try {
    // Simulate checking for new notifications
    // In a real app, you would query your database here
    const now = Date.now()
    const lastCheck = now - 60000 // Last minute

    // Simulate some random notifications for demo purposes
    const shouldHaveNotification = false // 30% chance

    if (shouldHaveNotification && notificationQueue.length === 0) {
      const notifications: NotificationData = {
        hasNotifications: true,
        message: "Você tem novas tarefas para revisar!",
        tasks: [
          {
            id: `task-${now}`,
            title: "Revisar relatório mensal",
            type: "reminder",
            priority: "high",
          },
          {
            id: `task-${now + 1}`,
            title: "Reunião com equipe",
            type: "overdue",
            priority: "medium",
          },
        ],
        timestamp: now,
      }
      notificationQueue.push(notifications)
    }

    // Return notifications and clear the queue
    if (notificationQueue.length > 0) {
      const notifications = notificationQueue.shift()
      return NextResponse.json(notifications)
    }

    return NextResponse.json({
      hasNotifications: false,
      timestamp: now,
    })
  } catch (error) {
    console.error("Erro ao verificar notificações:", error)
    return NextResponse.json(
      {
        hasNotifications: false,
        error: "Erro interno do servidor",
        timestamp: Date.now(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, message, tasks } = body

    // Add notification to queue
    const notification: NotificationData = {
      hasNotifications: true,
      message: message || "Nova notificação",
      tasks: tasks || [],
      timestamp: Date.now(),
    }

    notificationQueue.push(notification)

    return NextResponse.json({
      success: true,
      message: "Notificação adicionada à fila",
    })
  } catch (error) {
    console.error("Erro ao adicionar notificação:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
