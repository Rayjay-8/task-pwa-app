"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Settings } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { PushNotificationSettings } from "@/components/push-notification-settings"

export function NotificationSettings() {
  const { settings, permission, requestPermission, updateSettings } = useNotifications()

  const handlePermissionRequest = async () => {
    await requestPermission()
  }

  return (
    <div className="space-y-4">
      {/* Basic Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações de Notificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {permission === "granted" ? (
                <Bell className="w-5 h-5 text-green-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <div className="font-medium">
                  {permission === "granted"
                    ? "Notificações Ativadas"
                    : permission === "denied"
                      ? "Notificações Bloqueadas"
                      : "Notificações Desativadas"}
                </div>
                <div className="text-sm text-gray-600">
                  {permission === "granted"
                    ? "Você receberá notificações sobre suas tarefas"
                    : permission === "denied"
                      ? "Ative nas configurações do navegador"
                      : "Clique para ativar as notificações"}
                </div>
              </div>
            </div>
            {permission !== "granted" && (
              <Button onClick={handlePermissionRequest} size="sm">
                Ativar
              </Button>
            )}
          </div>

          {/* Notification Types */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-reminders" className="flex flex-col gap-1">
                <span>Lembretes de Tarefas</span>
                <span className="text-sm text-gray-600 font-normal">Notificações para tarefas próximas do prazo</span>
              </Label>
              <Switch
                id="task-reminders"
                checked={settings.taskReminders}
                onCheckedChange={(checked) => updateSettings({ taskReminders: checked })}
                disabled={permission !== "granted"}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="overdue-alerts" className="flex flex-col gap-1">
                <span>Alertas de Atraso</span>
                <span className="text-sm text-gray-600 font-normal">Notificações para tarefas em atraso</span>
              </Label>
              <Switch
                id="overdue-alerts"
                checked={settings.overdueAlerts}
                onCheckedChange={(checked) => updateSettings({ overdueAlerts: checked })}
                disabled={permission !== "granted"}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="daily-summary" className="flex flex-col gap-1">
                <span>Resumo Diário</span>
                <span className="text-sm text-gray-600 font-normal">Resumo das suas tarefas todos os dias</span>
              </Label>
              <Switch
                id="daily-summary"
                checked={settings.dailySummary}
                onCheckedChange={(checked) => updateSettings({ dailySummary: checked })}
                disabled={permission !== "granted"}
              />
            </div>
          </div>

          {/* Reminder Time */}
          {settings.dailySummary && (
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Horário do Resumo Diário</Label>
              <Input
                id="reminder-time"
                type="time"
                value={settings.reminderTime}
                onChange={(e) => updateSettings({ reminderTime: e.target.value })}
                disabled={permission !== "granted"}
                className="w-32"
              />
            </div>
          )}

          {/* Test Notification */}
          {permission === "granted" && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  new Notification("Teste de Notificação", {
                    body: "Suas notificações estão funcionando perfeitamente!",
                    icon: "/icon-192.png",
                  })
                }}
                className="w-full"
              >
                Testar Notificação Local
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <PushNotificationSettings />
    </div>
  )
}
