"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Smartphone, PhoneOffIcon as SmartphoneOff, Send } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

export function PushNotificationSettings() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe, sendTestNotification } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SmartphoneOff className="w-5 h-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-red-600 mb-2">
              <SmartphoneOff className="w-12 h-12 mx-auto mb-2" />
            </div>
            <h3 className="font-medium text-red-800 mb-1">Não Suportado</h3>
            <p className="text-sm text-red-600">Seu navegador não suporta push notifications</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-l-4 ${isSubscribed ? "border-l-green-500" : "border-l-orange-500"}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <Smartphone className="w-5 h-5 text-green-600" />
            ) : (
              <SmartphoneOff className="w-5 h-5 text-orange-500" />
            )}
            <div>
              <div className="font-medium flex items-center gap-2">
                Push Notifications
                {isSubscribed ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">Ativas</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">Inativas</Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isSubscribed
                  ? "Você receberá notificações mesmo com o app fechado"
                  : "Ative para receber notificações em background"}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isSubscribed ? (
            <>
              <Button variant="outline" onClick={unsubscribe} disabled={isLoading} className="flex-1 bg-transparent">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Desativar Push
              </Button>
              <Button variant="default" onClick={sendTestNotification} className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Testar
              </Button>
            </>
          ) : (
            <Button onClick={subscribe} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ativar Push Notifications
            </Button>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Push notifications funcionam mesmo com o app fechado</p>
          <p>• Você pode desativar a qualquer momento nas configurações</p>
          <p>• As notificações respeitam suas preferências de horário</p>
        </div>
      </CardContent>
    </Card>
  )
}
