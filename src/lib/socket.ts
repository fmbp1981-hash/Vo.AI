// Socket.io Server Configuration
// Real-time notifications and chat updates

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { NextApiRequest } from 'next'
import { Server as NetServer } from 'net'

export type NextApiResponseServerIO = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export type SocketUser = {
  userId: string
  socketId: string
  role: 'consultant' | 'admin' | 'client'
}

// Connected users tracking
const connectedUsers = new Map<string, SocketUser>()

let ioInstance: SocketIOServer | null = null

export const getIO = () => {
  if (!ioInstance) {
    console.warn('Socket.io not initialized! Returning null safe object or throwing.')
    // Return a dummy object or throw. For now, let's throw but maybe we should handle it gracefully if called before init.
    // However, server init happens before API routes usually.
    return null
  }
  return ioInstance
}

export const initSocketIO = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Store instance globally
  ioInstance = io

  // Connection handler
  io.on('connection', (socket: Socket) => {
    console.log('🔌 Socket.io client connected:', socket.id)

    // User authentication
    socket.on('authenticate', (data: { userId: string; role: string }) => {
      const user: SocketUser = {
        userId: data.userId,
        socketId: socket.id,
        role: data.role as 'consultant' | 'admin' | 'client',
      }

      connectedUsers.set(socket.id, user)
      console.log(`✅ User authenticated: ${data.userId} (${data.role})`)

      // Join user-specific room
      socket.join(`user:${data.userId}`)

      // Notify others about online status
      socket.broadcast.emit('user:online', {
        userId: data.userId,
        role: data.role,
      })
    })

    // Chat events
    socket.on('chat:message', (data: {
      leadId: string
      message: string
      sender: string
      senderType: 'ai' | 'consultant' | 'client'
    }) => {
      console.log('💬 Chat message:', data)

      // Broadcast to lead room
      io.to(`lead:${data.leadId}`).emit('chat:new_message', {
        ...data,
        timestamp: new Date().toISOString(),
        socketId: socket.id,
      })
    })

    // Typing indicator
    socket.on('chat:typing', (data: { leadId: string; userId: string; isTyping: boolean }) => {
      socket.to(`lead:${data.leadId}`).emit('chat:user_typing', {
        userId: data.userId,
        isTyping: data.isTyping,
      })
    })

    // Lead updates
    socket.on('lead:join', (leadId: string) => {
      socket.join(`lead:${leadId}`)
      console.log(`📋 Socket ${socket.id} joined lead room: ${leadId}`)
    })

    socket.on('lead:leave', (leadId: string) => {
      socket.leave(`lead:${leadId}`)
      console.log(`📋 Socket ${socket.id} left lead room: ${leadId}`)
    })

    socket.on('lead:update', (data: { leadId: string; field: string; value: any }) => {
      console.log('📝 Lead updated:', data)

      // Broadcast to all watching this lead
      io.to(`lead:${data.leadId}`).emit('lead:updated', {
        leadId: data.leadId,
        field: data.field,
        value: data.value,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('lead:status_change', (data: { leadId: string; newStatus: string; movedBy: string }) => {
      console.log('🔄 Lead status changed:', data)

      // Broadcast to all consultants
      io.to('consultants').emit('lead:status_changed', {
        ...data,
        timestamp: new Date().toISOString(),
      })
    })

    // Handover events
    socket.on('handover:request', (data: { leadId: string; reason: string; priority: string }) => {
      console.log('🔔 Handover requested:', data)

      // Notify all online consultants
      io.to('consultants').emit('handover:new_request', {
        ...data,
        timestamp: new Date().toISOString(),
      })
    })

    socket.on('handover:accept', (data: { leadId: string; consultantId: string }) => {
      console.log('✅ Handover accepted:', data)

      // Notify the lead
      io.to(`lead:${data.leadId}`).emit('handover:accepted', {
        consultantId: data.consultantId,
        timestamp: new Date().toISOString(),
      })
    })

    // Notification events
    socket.on('notification:send', (data: {
      userId: string
      title: string
      message: string
      type: 'info' | 'success' | 'warning' | 'error'
      link?: string
    }) => {
      console.log('🔔 Notification sent:', data)

      // Send to specific user
      io.to(`user:${data.userId}`).emit('notification:new', {
        ...data,
        id: `notif_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    })

    // Presence events
    socket.on('presence:update', (data: { status: 'online' | 'away' | 'busy' | 'offline' }) => {
      const user = connectedUsers.get(socket.id)
      if (user) {
        socket.broadcast.emit('presence:user_updated', {
          userId: user.userId,
          status: data.status,
        })
      }
    })

    // Disconnect handler
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id)

      if (user) {
        console.log(`👋 User disconnected: ${user.userId}`)

        // Notify others about offline status
        socket.broadcast.emit('user:offline', {
          userId: user.userId,
        })

        connectedUsers.delete(socket.id)
      } else {
        console.log('👋 Socket disconnected:', socket.id)
      }
    })

    // Error handler
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })
  })

  // Helper functions for emitting from server-side
  const emitToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data)
  }

  const emitToLead = (leadId: string, event: string, data: any) => {
    io.to(`lead:${leadId}`).emit(event, data)
  }

  const emitToConsultants = (event: string, data: any) => {
    io.to('consultants').emit(event, data)
  }

  const emitToAll = (event: string, data: any) => {
    io.emit(event, data)
  }

  return {
    io,
    emitToUser,
    emitToLead,
    emitToConsultants,
    emitToAll,
    getConnectedUsers: () => Array.from(connectedUsers.values()),
    getUserCount: () => connectedUsers.size,
  }
}

// Export types
export type SocketIOInstance = ReturnType<typeof initSocketIO>
