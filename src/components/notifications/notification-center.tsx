'use client'

import { useEffect, useState } from 'react'
import { Bell, X, Check, Info, AlertTriangle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'sonner'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: 'success' | 'info' | 'warning' | 'error'
    link?: string
    read: boolean
    timestamp: Date
}

interface NotificationCenterProps {
    userId: string
    role: 'consultant' | 'customer'
}

export function NotificationCenter({ userId, role }: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [open, setOpen] = useState(false)
    const { isConnected, on } = useSocket(userId, role)

    useEffect(() => {
        // Listen for new notifications from Socket.io
        const unsubscribe = on('notification:new', (notification: any) => {
            const newNotification: Notification = {
                id: notification.id || crypto.randomUUID(),
                title: notification.title,
                message: notification.message,
                type: notification.type || 'info',
                link: notification.link,
                read: false,
                timestamp: new Date(),
            }

            setNotifications((prev) => [newNotification, ...prev])

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/logo.png',
                })
            }

            // Show toast
            toast[notification.type || 'info'](notification.title, {
                description: notification.message,
            })
        })

        return unsubscribe
    }, [on])

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    const unreadCount = notifications.filter((n) => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
    }

    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }

    const removeNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return <Check className="w-4 h-4 text-green-600" />
            case 'warning':
                return <AlertTriangle className="w-4 h-4 text-yellow-600" />
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-600" />
            default:
                return <Info className="w-4 h-4 text-blue-600" />
        }
    }

    const formatTimestamp = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Agora'
        if (minutes < 60) return `${minutes}m atrás`
        if (hours < 24) return `${hours}h atrás`
        return `${days}d atrás`
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    {!isConnected && (
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 rounded-full border-2 border-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h3 className="font-semibold">Notificações</h3>
                        <p className="text-xs text-muted-foreground">
                            {isConnected ? 'Conectado' : 'Desconectado'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs"
                        >
                            Marcar todas como lidas
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <Bell className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                Nenhuma notificação
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={`border-0 rounded-none ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">{getIcon(notification.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4
                                                        className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 -mt-1"
                                                        onClick={() => removeNotification(notification.id)}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTimestamp(notification.timestamp)}
                                                    </span>
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            onClick={() => {
                                                                markAsRead(notification.id)
                                                                setOpen(false)
                                                            }}
                                                        >
                                                            <Button variant="link" size="sm" className="h-6 text-xs p-0">
                                                                Ver detalhes
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
