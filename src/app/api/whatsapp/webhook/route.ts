import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp'
import { getIO } from '@/lib/socket'
import { generateChatCompletion, detectHandoverIntent } from '@/lib/openai'
import { normalizePhoneNumber } from '@/lib/whatsapp/helpers'
import { AutomationEngine } from '@/lib/automations'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Webhook handler for incoming WhatsApp messages from Evolution API
 * POST /api/whatsapp/webhook
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        console.log('[Webhook] Received data:', JSON.stringify(data, null, 2))

        // Extract message data from Evolution API webhook payload
        const messageData = data.data || data
        const messageType = messageData.messageType || messageData.type

        // Ignore non-text messages for now
        if (messageType !== 'conversation' && messageType !== 'extendedTextMessage') {
            console.log('[Webhook] Ignoring non-text message type:', messageType)
            return NextResponse.json({ success: true, message: 'Ignored non-text message' })
        }

        // Extract phone number and message content
        const fromPhone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') ||
            messageData.from?.replace('@s.whatsapp.net', '') ||
            messageData.remoteJid?.replace('@s.whatsapp.net', '')

        const messageText = messageData.message?.conversation ||
            messageData.message?.extendedTextMessage?.text ||
            messageData.body ||
            messageData.text

        // Ignore if no phone or message
        if (!fromPhone || !messageText) {
            console.log('[Webhook] Missing phone or message')
            return NextResponse.json({ success: false, error: 'Missing phone or message' }, { status: 400 })
        }

        // Ignore own messages (fromMe = true)
        if (messageData.key?.fromMe || messageData.fromMe) {
            console.log('[Webhook] Ignoring own message')
            return NextResponse.json({ success: true, message: 'Ignored own message' })
        }

        console.log(`[Webhook] Processing message from ${fromPhone}: "${messageText}"`)

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(fromPhone)

        // Get or create lead
        let lead = await prisma.lead.findFirst({
            where: { telefoneNormalizado: normalizedPhone }
        })

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    nome: fromPhone, // Will be updated when AI extracts name
                    telefone: fromPhone,
                    telefoneNormalizado: normalizedPhone,
                    canal: 'WhatsApp',
                    status: 'Novo Lead',
                    estagio: 'Novo Lead',
                    ultimaMensagem: messageText,
                    dataUltimaMensagem: new Date(),
                }
            })
            console.log('[Webhook] Created new lead:', lead.id)

            // Trigger automation: Lead Created
            await AutomationEngine.trigger('lead_created', {
                leadId: lead.id,
                userId: lead.userId || undefined // Might be null initially
            })
        } else {
            // Update last message
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    ultimaMensagem: messageText,
                    dataUltimaMensagem: new Date(),
                    lastContactAt: new Date(),
                }
            })
            console.log('[Webhook] Updated existing lead:', lead.id)
        }

        // Get or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                leadId: lead.id,
                channel: 'whatsapp',
                status: { not: 'closed' }
            }
        })

        let messages: any[] = []
        if (conversation) {
            try {
                messages = JSON.parse(conversation.messages || '[]')
            } catch (e) {
                messages = []
            }
        } else {
            conversation = await prisma.conversation.create({
                data: {
                    leadId: lead.id,
                    channel: 'whatsapp',
                    messages: '[]',
                    status: 'active',
                    handoffMode: 'ai',
                }
            })
            console.log('[Webhook] Created new conversation:', conversation.id)
        }

        // Add incoming message to history
        messages.push({
            role: 'user',
            content: messageText,
            timestamp: new Date().toISOString(),
            from: normalizedPhone,
        })

        // Emit socket event for incoming message
        const io = getIO()
        if (io) {
            io.to(`lead:${lead.id}`).emit('chat:new_message', {
                leadId: lead.id,
                message: messageText,
                sender: 'client',
                senderType: 'client',
                timestamp: new Date().toISOString(),
            })
        }

        // Check if handover is needed
        const handoverCheck = detectHandoverIntent(messageText)
        const whatsapp = getWhatsAppProvider()

        if (handoverCheck.shouldHandover && handoverCheck.confidence > 0.6) {
            console.log('[Webhook] Handover detected:', handoverCheck.reason)

            // Update conversation status
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'waiting_handoff',
                    handoffMode: 'human',
                    handoffReason: handoverCheck.reason,
                    handoffRequestedAt: new Date(),
                    messages: JSON.stringify(messages),
                }
            })

            // Update lead status
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    status: 'Aguardando Atendimento',
                    estagio: 'Aguardando Atendimento',
                }
            })

            // Send handover message
            const handoverMessage = `Entendi que você deseja falar com um consultor! 👤\n\nUm de nossos especialistas em viagens entrará em contato em breve.\n\n⏱️ Tempo médio de resposta: 15 minutos (horário comercial)`

            await whatsapp.sendTextMessage({
                number: normalizedPhone,
                message: handoverMessage,
            })

            // Add AI response to history
            messages.push({
                role: 'assistant',
                content: handoverMessage,
                timestamp: new Date().toISOString(),
                handover: true,
            })

            // Emit socket event for handover
            const io = getIO()
            if (io) {
                io.to(`lead:${lead.id}`).emit('chat:new_message', {
                    leadId: lead.id,
                    message: handoverMessage,
                    sender: 'ai',
                    senderType: 'ai',
                    timestamp: new Date().toISOString(),
                })

                io.emit('handover:new_request', {
                    leadId: lead.id,
                    reason: handoverCheck.reason,
                    priority: 'high',
                    timestamp: new Date().toISOString(),
                })
            }

            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { messages: JSON.stringify(messages) }
            })

            // TODO: Notify consultant via WebSocket/Push notification

            return NextResponse.json({ success: true, handover: true })
        }

        // Generate AI response using Sofia
        console.log('[Webhook] Generating AI response...')

        const leadContext = {
            nome: lead.nome,
            destino: lead.destino || undefined,
            orcamento: lead.orcamento || undefined,
            dataPartida: lead.dataPartida?.toISOString() || undefined,
            dataRetorno: lead.dataRetorno?.toISOString() || undefined,
            pessoas: lead.pessoas || undefined,
        }

        const aiResponse = await generateChatCompletion({
            messages: messages.slice(-10).map((m: any) => ({ // Last 10 messages for context
                role: m.role,
                content: m.content,
            })),
            leadContext,
        })

        console.log('[Webhook] AI response generated:', aiResponse.substring(0, 100))

        // Send AI response via WhatsApp
        await whatsapp.sendTextMessage({
            number: normalizedPhone,
            message: aiResponse,
        })

        // Add AI response to history
        messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
        })

        // Emit socket event for AI response
        const io = getIO()
        if (io) {
            io.to(`lead:${lead.id}`).emit('chat:new_message', {
                leadId: lead.id,
                message: aiResponse,
                sender: 'ai',
                senderType: 'ai',
                timestamp: new Date().toISOString(),
            })
        }

        // Save updated conversation
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                messages: JSON.stringify(messages),
                lastAiMessageAt: new Date(),
            }
        })

        // Mark message as read
        try {
            const messageId = messageData.key?.id || messageData.id
            if (messageId) {
                await whatsapp.markAsRead({
                    messageId,
                    remoteJid: `${normalizedPhone}@s.whatsapp.net`,
                })
            }
        } catch (error) {
            console.error('[Webhook] Error marking as read:', error)
        }

        console.log('[Webhook] Processing complete')

        return NextResponse.json({ success: true, leadId: lead.id })
    } catch (error: any) {
        console.error('[Webhook] Error processing webhook:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}

/**
 * Health check endpoint
 * GET /api/whatsapp/webhook
 */
export async function GET(request: NextRequest) {
    return NextResponse.json({
        success: true,
        message: 'WhatsApp webhook is active',
        timestamp: new Date().toISOString(),
    })
}
