const CACHE_NAME = "task-manager-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)))
  self.skipWaiting()
})

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(checkForNotificationsWithRetry())
  }
})

// Push event for notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nova tarefa disponível!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "Ver Tarefas",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "Fechar",
        icon: "/icon-192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Task Manager", options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore" || event.action === "view") {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === self.location.origin && "focus" in client) {
            return client.focus()
          }
        }
        // Otherwise, open new window
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})

async function checkForNotificationsWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch("/api/notify")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.hasNotifications) {
        await self.registration.showNotification("Task Manager", {
          body: data.message || "Você tem novas tarefas!",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: "background-notification",
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
          data: {
            timestamp: data.timestamp,
            tasks: data.tasks || [],
          },
        })

        // Show individual task notifications if available
        if (data.tasks && data.tasks.length > 0) {
          for (let j = 0; j < data.tasks.length; j++) {
            const task = data.tasks[j]
            const typeMessages = {
              reminder: "Lembrete",
              overdue: "Em atraso",
              new: "Nova tarefa",
            }

            setTimeout(() => {
              self.registration.showNotification(typeMessages[task.type] || "Tarefa", {
                body: task.title,
                icon: "/icon-192.png",
                tag: `task-${task.id}`,
                data: { taskId: task.id, type: task.type },
              })
            }, j * 1000)
          }
        }
      }

      return // Success, exit retry loop
    } catch (error) {
      console.error(`Tentativa ${i + 1} falhou:`, error)

      if (i === retries - 1) {
        // Last retry failed, show error notification
        self.registration.showNotification("Task Manager - Erro", {
          body: "Não foi possível verificar novas tarefas. Verifique sua conexão.",
          icon: "/icon-192.png",
          tag: "sync-error",
        })
      } else {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-notifications") {
    event.waitUntil(checkForNotificationsWithRetry())
  }
})

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }

  if (event.data && event.data.type === "CHECK_NOTIFICATIONS") {
    event.waitUntil(checkForNotificationsWithRetry())
  }
})
