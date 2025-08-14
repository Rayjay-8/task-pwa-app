"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface PushSubscriptionState {
  isSupported: boolean
  isSubscribed: boolean
  subscription: PushSubscription | null
  isLoading: boolean
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    subscription: null,
    isLoading: true,
  })
  const { toast } = useToast()

  // VAPID public key (in production, this should be from environment variables)
  const vapidPublicKey = "BEreLRzv-dL3zHq_hs-RfxxrR-JwbxPd2VBBTaHP-lhHLtFHyIuFLLpd2buhg5dVgz22MR-_IJd2il4KsQtZ5eM"

  const checkSupport = useCallback(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window

    setState((prev) => ({ ...prev, isSupported }))
    return isSupported
  }, [])

  const checkSubscription = useCallback(async () => {
    if (!checkSupport()) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
        isLoading: false,
      }))
    } catch (error) {
      console.error("Erro ao verificar subscription:", error)
      setState((prev) => ({ ...prev, isLoading: false }))
    }
  }, [checkSupport])

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Push notifications não suportadas",
        description: "Seu navegador não suporta push notifications",
        variant: "destructive",
      })
      return false
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Ative as notificações nas configurações do navegador",
          variant: "destructive",
        })
        setState((prev) => ({ ...prev, isLoading: false }))
        return false
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Send subscription to server
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!response.ok) {
        throw new Error("Falha ao registrar subscription no servidor")
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        subscription,
        isLoading: false,
      }))

      toast({
        title: "Push notifications ativadas",
        description: "Você receberá notificações mesmo com o app fechado",
      })

      return true
    } catch (error) {
      console.error("Erro ao fazer subscription:", error)
      toast({
        title: "Erro ao ativar push notifications",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }, [state.isSupported, toast, vapidPublicKey])

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return false

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      // Unsubscribe from push notifications
      await state.subscription.unsubscribe()

      // Remove subscription from server
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(state.subscription.toJSON()),
      })

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        isLoading: false,
      }))

      toast({
        title: "Push notifications desativadas",
        description: "Você não receberá mais notificações push",
      })

      return true
    } catch (error) {
      console.error("Erro ao cancelar subscription:", error)
      toast({
        title: "Erro ao desativar push notifications",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isLoading: false }))
      return false
    }
  }, [state.subscription, toast])

  const sendTestNotification = useCallback(async () => {
    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Teste de Push Notification",
          body: "Esta é uma notificação de teste do Task Manager!",
          tag: "test-notification",
          data: { type: "test" },
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao enviar notificação de teste")
      }

      toast({
        title: "Notificação de teste enviada",
        description: "Verifique se recebeu a push notification",
      })
    } catch (error) {
      console.error("Erro ao enviar notificação de teste:", error)
      toast({
        title: "Erro ao enviar teste",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    checkSubscription()
  }, [checkSubscription])

  return {
    ...state,
    subscribe,
    unsubscribe,
    sendTestNotification,
    checkSubscription,
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
