import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "Task Manager PWA",
  description: "Gerenciador de tarefas com notificações em background",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Task Manager",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Task Manager" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Request notification permission
                      if ('Notification' in window && Notification.permission === 'default') {
                        Notification.requestPermission();
                      }
                      
                      return navigator.serviceWorker.ready;
                    })
                    .then(function(registration) {
                      // Register for background sync after SW is ready
                      if ('sync' in window.ServiceWorkerRegistration.prototype) {
                        registration.sync.register('background-sync')
                          .then(() => console.log('Background sync registered'))
                          .catch(err => console.warn('Background sync registration failed:', err));
                      }
                      
                      // Try to register periodic sync (only works when PWA is installed)
                      if ('periodicSync' in window.ServiceWorkerRegistration.prototype) {
                        registration.periodicSync.register('check-notifications', {
                          minInterval: 60000 // 1 minute
                        })
                          .then(() => {
                            console.log('Periodic sync registered successfully');
                          })
                          .catch(err => {
                            console.warn('Periodic sync not available (PWA needs to be installed):', err.message);
                            // Fallback to regular polling when periodic sync fails
                            startFallbackPolling();
                          });
                      } else {
                        console.warn('Periodic sync not supported by this browser');
                        // Fallback to regular polling
                        startFallbackPolling();
                      }
                      
                      function startFallbackPolling() {
                        console.log('Starting fallback polling every 2 minutes');
                        setInterval(async () => {
                          try {
                            const response = await fetch('/api/notify');
                            const data = await response.json();
                            
                            if (data.hasNotifications && 'Notification' in window && Notification.permission === 'granted') {
                              new Notification(data.title || 'Nova tarefa!', {
                                body: data.message || 'Você tem tarefas pendentes',
                                icon: '/icon-192.png',
                                badge: '/icon-192.png',
                                tag: 'task-notification'
                              });
                            }
                          } catch (error) {
                            console.error('Fallback polling error:', error);
                          }
                        }, 120000); // 2 minutes
                      }
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
