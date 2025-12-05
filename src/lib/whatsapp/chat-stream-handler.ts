import { getIO } from '@/lib/socket'

export interface WhatsAppMessage {
    id: string
    from: string
    to: string
    body: string
    timestamp: Date
    type: 'text' | 'image' | 'video' | 'audio' | 'document'
    status: 'sent' | 'delivered' | 'read' | 'failed'
    isFromMe: boolean
}

export class WhatsAppStreamHandler {
    private io: any

    constructor() {
        this.io = getIO()
    }

    /**
     * Handle incoming WhatsApp message and broadcast via Socket.io
     */
    async handleIncomingMessage(message: WhatsAppMessage, leadId?: string) {
        if (!this.io) {
            console.warn('Socket.io not initialized')
            return
        }

        console.log(`[WhatsApp Stream] New message from ${message.from}`)

        // Emit to specific lead room if leadId provided
        if (leadId) {
            this.io.to(`lead:${leadId}`).emit('whatsapp:message', {
                ...message,
                timestamp: message.timestamp.toISOString(),
            })
        }

        // Emit to all consultants
        this.io.to('role:consultant').emit('whatsapp:new_message', {
            ...message,
            leadId,
            timestamp: message.timestamp.toISOString(),
        })

        // Send browser notification to assigned consultant if any
        if (leadId) {
            this.io.to(`lead:${leadId}`).emit('notification:new', {
                id: `notif_whatsapp_${Date.now()}`,
                title: 'Nova mensagem WhatsApp',
                message: `${message.from}: ${message.body.substring(0, 50)}...`,
                type: 'info',
                link: `/chat/${leadId}`,
                timestamp: new Date().toISOString(),
                read: false,
            })
        }
    }

    /**
     * Handle typing indicator
     */
    async handleTypingIndicator(from: string, leadId: string, isTyping: boolean) {
        if (!this.io) return

        this.io.to(`lead:${leadId}`).emit('whatsapp:typing', {
            from,
            leadId,
            isTyping,
            timestamp: new Date().toISOString(),
        })
    }

    /**
     * Handle message status update (delivered, read, etc)
     */
    async handleMessageStatus(messageId: string, status: WhatsAppMessage['status'], leadId?: string) {
        if (!this.io) return

        const event = {
            messageId,
            status,
            timestamp: new Date().toISOString(),
        }

        if (leadId) {
            this.io.to(`lead:${leadId}`).emit('whatsapp:status', event)
        }

        this.io.to('role:consultant').emit('whatsapp:status', {
            ...event,
            leadId,
        })
    }

    /**
     * Broadcast message sent by consultant
     */
    async broadcastOutgoingMessage(message: WhatsAppMessage, leadId: string, consultantId: string) {
        if (!this.io) return

        this.io.to(`lead:${leadId}`).emit('whatsapp:message', {
            ...message,
            timestamp: message.timestamp.toISOString(),
        })

        // Notify other consultants watching this lead
        this.io.to(`lead:${leadId}`).except(`user:${consultantId}`).emit('notification:new', {
            id: `notif_${Date.now()}`,
            title: 'Mensagem enviada',
            message: `Consultor enviou: ${message.body.substring(0, 50)}...`,
            type: 'info',
            link: `/chat/${leadId}`,
            timestamp: new Date().toISOString(),
            read: false,
        })
    }
}

// Singleton instance
let handlerInstance: WhatsAppStreamHandler | null = null

export function getWhatsAppStreamHandler(): WhatsAppStreamHandler {
    if (!handlerInstance) {
        handlerInstance = new WhatsAppStreamHandler()
    }
    return handlerInstance
}
