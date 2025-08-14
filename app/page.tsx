"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Calendar, SettingsIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { NotificationSettings } from "@/components/notification-settings"
import { BackgroundSyncStatus } from "@/components/background-sync-status"
import { useNotifications } from "@/hooks/use-notifications"

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: Date
  dueDate?: Date
}

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()
  const { showNotification, scheduleNotifications, settings } = useNotifications()

  useEffect(() => {
    // Load tasks from localStorage
    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }))
      setTasks(parsedTasks)
    }
  }, [])

  useEffect(() => {
    // Save tasks to localStorage
    localStorage.setItem("tasks", JSON.stringify(tasks))

    scheduleNotifications(tasks)
  }, [tasks, scheduleNotifications])

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "Erro",
        description: "O título da tarefa é obrigatório",
        variant: "destructive",
      })
      return
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      completed: false,
      priority: newTaskPriority,
      createdAt: new Date(),
      dueDate: newTaskDueDate ? new Date(newTaskDueDate) : undefined,
    }

    setTasks((prev) => [newTask, ...prev])
    setNewTaskTitle("")
    setNewTaskDescription("")
    setNewTaskPriority("medium")
    setNewTaskDueDate("")

    toast({
      title: "Tarefa criada",
      description: `"${newTask.title}" foi adicionada à sua lista`,
    })

    showNotification("Nova tarefa criada!", {
      body: newTask.title,
      tag: "new-task",
    })
  }

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const updatedTask = { ...task, completed: !task.completed }

          if (updatedTask.completed) {
            toast({
              title: "Tarefa concluída",
              description: `"${task.title}" foi marcada como concluída`,
            })

            showNotification("Tarefa concluída!", {
              body: task.title,
              tag: "task-completed",
            })
          }

          return updatedTask
        }
        return task
      }),
    )
  }

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((task) => task.id === id)
    setTasks((prev) => prev.filter((task) => task.id !== id))

    if (taskToDelete) {
      toast({
        title: "Tarefa removida",
        description: `"${taskToDelete.title}" foi removida da sua lista`,
      })
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Média"
      case "low":
        return "Baixa"
      default:
        return "Média"
    }
  }

  const isOverdue = (task: Task) => {
    return task.dueDate && !task.completed && task.dueDate < new Date()
  }

  const completedTasks = tasks.filter((task) => task.completed)
  const pendingTasks = tasks.filter((task) => !task.completed)
  const overdueTasks = tasks.filter((task) => isOverdue(task))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-600">Gerencie suas tarefas com notificações inteligentes</p>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            {showSettings ? "Ocultar" : "Configurações"}
          </Button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="space-y-4">
            <NotificationSettings />
            <BackgroundSyncStatus enabled={settings.enabled} interval={60000} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{tasks.length}</div>
              <div className="text-sm text-gray-600">Total de tarefas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
              <div className="text-sm text-gray-600">Em atraso</div>
            </CardContent>
          </Card>
        </div>

        {/* Add Task Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Título da tarefa"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTask()}
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as "low" | "medium" | "high")}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Prioridade Baixa</option>
                <option value="medium">Prioridade Média</option>
                <option value="high">Prioridade Alta</option>
              </select>
            </div>
            <Input
              placeholder="Descrição (opcional)"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
            />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Input
                type="datetime-local"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="flex-1"
                placeholder="Data de vencimento (opcional)"
              />
            </div>
            <Button onClick={addTask} className="w-full flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Tarefa
            </Button>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium mb-2">Nenhuma tarefa ainda</h3>
                  <p>Adicione sua primeira tarefa para começar!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card
                key={task.id}
                className={`transition-all ${task.completed ? "opacity-75" : ""} ${
                  isOverdue(task) ? "border-red-200 bg-red-50" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                        >
                          {task.title}
                        </h3>
                        <Badge className={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
                        {isOverdue(task) && <Badge className="bg-red-100 text-red-800 border-red-200">Em atraso</Badge>}
                      </div>
                      {task.description && (
                        <p className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-600"}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>
                          Criada em {task.createdAt.toLocaleDateString("pt-BR")} às{" "}
                          {task.createdAt.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {task.dueDate && (
                          <div className={isOverdue(task) ? "text-red-600 font-medium" : ""}>
                            Vence em {task.dueDate.toLocaleDateString("pt-BR")} às{" "}
                            {task.dueDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
