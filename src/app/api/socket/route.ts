import { Server } from 'socket.io'
import { NextApiRequest } from 'next'
import { Server as HTTPServer } from 'http'
import { NextResponse } from 'next/server'

export const config = {
    api: {
        bodyParser: false,
    },
}

let io: Server | undefined

export async function GET(req: NextApiRequest, res: any) {
    if (!io) {
        console.log('[Socket.io] Initializing server...')

        const httpServer: HTTPServer = res.socket.server as HTTPServer

        io = new Server(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true,
            },
        })

        io.on('connection', (socket) => {
            console.log('✅ Client connected:', socket.id)

            // Join rooms based on user data
            socket.on('join', ({ userId, role }: { userId: string; role: string }) => {
                socket.join(`user:${userId}`)
                socket.join(`role:${role}`)
                console.log(`👤 User ${userId} joined with role ${role}`)

                // Send connection confirmation
                socket.emit('connected', {
                    socketId: socket.id,
                    userId,
                    role
                })
            })

            // Lead update events
            socket.on('lead:update', (data) => {
                console.log('[Lead Update]', data.leadId)
                // Broadcast to all consultants
                io?.to('role:consultant').emit('lead:updated', data)
                io?.to('role:admin').emit('lead:updated', data)
            })

            // Lead status change (kanban column move)
            socket.on('lead:status-change', (data) => {
                console.log('[Lead Status Change]', data.leadId, '->', data.newStatus)
                // Broadcast to all users
                io?.emit('lead:status-changed', data)
            })

            // Chat message events
            socket.on('chat:message', (data) => {
                console.log('[Chat Message]', data.conversationId)
                // Emit to specific lead's room
                io?.to(`lead:${data.leadId}`).emit('chat:new-message', data)
                // Also emit to consultants
                io?.to('role:consultant').emit('chat:new-message', data)
            })

            // Typing indicators
            socket.on('chat:typing', (data) => {
                socket.to(`lead:${data.leadId}`).emit('chat:typing', {
                    userId: data.userId,
                    isTyping: data.isTyping,
                })
            })

            // Notification events
            socket.on('notification:send', (data) => {
                console.log('[Notification]', data.type, 'to', data.targetUserId || 'all')

                if (data.targetUserId) {
                    // Send to specific user
                    io?.to(`user:${data.targetUserId}`).emit('notification', data)
                } else if (data.targetRole) {
                    // Send to specific role
                    io?.to(`role:${data.targetRole}`).emit('notification', data)
                } else {
                    // Broadcast to all
                    io?.emit('notification', data)
                }
            })

            // Handover events
            socket.on('handover:request', (data) => {
                console.log('[Handover Request]', data.conversationId)
                // Notify all consultants
                io?.to('role:consultant').emit('handover:requested', data)
                io?.to('role:admin').emit('handover:requested', data)
            })

            socket.on('handover:accept', (data) => {
                console.log('[Handover Accept]', data.conversationId, 'by', data.consultantId)
                // Notify the lead and other consultants
                io?.to(`lead:${data.leadId}`).emit('handover:accepted', data)
                io?.to('role:consultant').emit('handover:accepted', data)
            })

            // User presence
            socket.on('presence:update', (data) => {
                io?.to('role:consultant').emit('presence:changed', {
                    userId: data.userId,
                    status: data.status, // 'online', 'away', 'busy', 'offline'
                    lastSeen: new Date(),
                })
            })

            // Disconnect handling
            socket.on('disconnect', () => {
                console.log('❌ Client disconnected:', socket.id)
            })

            // Error handling
            socket.on('error', (error) => {
                console.error('[Socket.io Error]', error)
            })
        })

        console.log('[Socket.io] Server initialized successfully')
    } else {
        console.log('[Socket.io] Server already running')
    }

    // Return a response to prevent timeout
    return NextResponse.json({
        success: true,
        message: 'Socket.io server is running',
        timestamp: new Date().toISOString()
    })
}
