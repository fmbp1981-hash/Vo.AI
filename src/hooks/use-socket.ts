// Socket.io Client Hook
// React hook for real-time features

'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export type NotificationData = {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  link?: string
  timestamp: string
  read: boolean
}

export type ChatMessage = {
  leadId: string
  message: string
  sender: string
  senderType: 'ai' | 'consultant' | 'client'
  timestamp: string
}

export type LeadUpdate = {
  leadId: string
  field: string
  value: any
  timestamp: string
}

export type UserPresence = {
  userId: string
  status: 'online' | 'away' | 'busy' | 'offline'
}

export const useSocket = (userId?: string, role?: string) => {
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize socket connection
    if (!socketRef.current) {
      socketRef.current = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      const socket = socketRef.current

      // Connection events
      socket.on('connect', () => {
        console.log('✅ Socket.io connected')
        setIsConnected(true)

        // Join rooms if credentials provided
        if (userId && role) {
          socket.emit('join', { userId, role })
        }
      })

      socket.on('disconnect', () => {
        console.log('❌ Socket.io disconnected')
        setIsConnected(false)
      })

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error)
        setIsConnected(false)
      })

      // User presence events
      socket.on('user:online', (data: { userId: string; role: string }) => {
        setOnlineUsers((prev) => new Set(prev).add(data.userId))
      })

      socket.on('user:offline', (data: { userId: string }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev)
          updated.delete(data.userId)
          return updated
        })
      })

      // Notification events
      socket.on('notification:new', (notification: NotificationData) => {
        console.log('🔔 New notification:', notification)
        setNotifications((prev) => [notification, ...prev])

        // Show browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
          })
        }
      })

      // Typing indicator
      socket.on('chat:user_typing', (data: { userId: string; isTyping: boolean }) => {
        setTypingUsers((prev) => {
          const updated = new Set(prev)
          if (data.isTyping) {
            updated.add(data.userId)
          } else {
            updated.delete(data.userId)
          }
          return updated
        })
      })

      // Error handling
      socket.on('error', (error) => {
        console.error('❌ Socket error:', error)
      })
    }

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [userId, role])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Socket methods
  const joinLeadRoom = (leadId: string) => {
    socketRef.current?.emit('lead:join', leadId)
  }

  const leaveLeadRoom = (leadId: string) => {
    socketRef.current?.emit('lead:leave', leadId)
  }

  const sendMessage = (data: Omit<ChatMessage, 'timestamp'>) => {
    socketRef.current?.emit('chat:message', data)
  }

  const setTyping = (leadId: string, isTyping: boolean) => {
    if (userId) {
      socketRef.current?.emit('chat:typing', { leadId, userId, isTyping })
    }
  }

  const updateLead = (leadId: string, field: string, value: any) => {
    socketRef.current?.emit('lead:update', { leadId, field, value })
  }

  const changeLeadStatus = (leadId: string, newStatus: string) => {
    if (userId) {
      socketRef.current?.emit('lead:status_change', {
        leadId,
        newStatus,
        movedBy: userId,
      })
    }
  }

  const requestHandover = (leadId: string, reason: string, priority: 'low' | 'medium' | 'high') => {
    socketRef.current?.emit('handover:request', { leadId, reason, priority })
  }

  const acceptHandover = (leadId: string) => {
    if (userId) {
      socketRef.current?.emit('handover:accept', { leadId, consultantId: userId })
    }
  }

  const updatePresence = (status: UserPresence['status']) => {
    socketRef.current?.emit('presence:update', { status })
  }

  const markNotificationRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // Event listener helpers
  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback)
    return () => {
      socketRef.current?.off(event, callback)
    }
  }

  const off = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback)
  }

  return {
    // Connection state
    isConnected,
    socket: socketRef.current,

    // State
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    typingUsers: Array.from(typingUsers),
    onlineUsers: Array.from(onlineUsers),

    // Methods
    joinLeadRoom,
    leaveLeadRoom,
    sendMessage,
    setTyping,
    updateLead,
    changeLeadStatus,
    requestHandover,
    acceptHandover,
    updatePresence,
    markNotificationRead,
    clearNotifications,

    // Event listeners
    on,
    off,
  }
}
