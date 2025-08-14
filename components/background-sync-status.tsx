"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from "lucide-react"
import { useBackgroundSync } from "@/hooks/use-background-sync"

interface BackgroundSyncStatusProps {
  enabled: boolean
  interval?: number
}

export function BackgroundSyncStatus({ enabled, interval = 60000 }: BackgroundSyncStatusProps) {
  const { isPolling, lastCheck, error, checkForNotifications } = useBackgroundSync({
    enabled,
    interval,
  })

  const formatLastCheck = (date: Date | null) => {
    if (!date) return "Nunca"

    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Agora mesmo"
    if (minutes === 1) return "1 minuto atrás"
    if (minutes < 60) return `${minutes} minutos atrás`

    const hours = Math.floor(minutes / 60)
    if (hours === 1) return "1 hora atrás"
    if (hours < 24) return `${hours} horas atrás`

    return date.toLocaleDateString("pt-BR")
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPolling ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
            <div>
              <div className="font-medium flex items-center gap-2">
                Sincronização em Background
                {isPolling ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Ativa</Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inativa</Badge>
                )}
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Última verificação: {formatLastCheck(lastCheck)}
              </div>
              {error && (
                <div className="text-sm text-red-600 flex items-center gap-2 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  Erro: {error}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkForNotifications}
            disabled={!enabled}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar Agora
          </Button>
        </div>

        {enabled && (
          <div className="mt-3 text-xs text-gray-500">
            Verificando automaticamente a cada {Math.floor(interval / 60000)} minuto(s)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
