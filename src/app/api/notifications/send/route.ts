import { NextRequest, NextResponse } from 'next/server'
import { getIO } from '@/lib/socket'

/**
 * Test endpoint to send notifications via Socket.io
 * 
 * Usage:
 * POST /api/notifications/send
 * Body: {
 *   userId: string
 *   title: string
 *   message: string
 *   type: 'success' | 'info' | 'warning' | 'error'
 *   link?: string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { userId, title, message, type = 'info', link } = body

        if (!userId || !title || !message) {
            return NextResponse.json(
                { error: 'userId, title e message são obrigatórios' },
                { status: 400 }
            )
        }

        const io = getIO()

        if (!io) {
            return NextResponse.json(
                { error: 'Socket.io não está inicializado' },
                { status: 500 }
            )
        }

        // Send notification via Socket.io
        io.to(`user:${userId}`).emit('notification:new', {
            id: `notif_${Date.now()}`,
            title,
            message,
            type,
            link,
            timestamp: new Date().toISOString(),
            read: false,
        })

        return NextResponse.json({
            success: true,
            message: 'Notificação enviada com sucesso',
            data: {
                userId,
                title,
                message,
                type,
            },
        })
    } catch (error) {
        console.error('Error sending test notification:', error)
        return NextResponse.json(
            { error: 'Erro ao enviar notificação' },
            { status: 500 }
        )
    }
}

// GET endpoint to test if Socket.io is working
export async function GET() {
    const io = getIO()

    return NextResponse.json({
        socketIOInitialized: io !== null,
        connectedClients: io ? 'Socket.io está funcionando' : 'Socket.io não inicializado',
    })
}
