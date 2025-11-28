'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { Bell, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationCenterProps {
  userId: string
  role: 'consultant' | 'admin' | 'client'
}

export function NotificationCenter({ userId, role }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    clearNotifications,
    requestNotificationPermission,
  } = useSocket({ userId, role })

  const [isOpen, setIsOpen] = useState(false)

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markNotificationRead(notificationId)
    
    if (link) {
      window.location.href = link
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      default:
        return 'ℹ️'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificações</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearNotifications}
              className="h-8 text-xs"
            >
              Limpar todas
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent cursor-pointer transition-colors ${
                    !notification.read ? 'bg-accent/50' : ''
                  }`}
                  onClick={() =>
                    handleNotificationClick(notification.id, notification.link)
                  }
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          !notification.read
                            ? getNotificationColor(notification.type)
                            : 'bg-gray-300'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <span>{getNotificationIcon(notification.type)}</span>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              markNotificationRead(notification.id)
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
