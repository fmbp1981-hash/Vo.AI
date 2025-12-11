import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp'
import { getIO } from '@/lib/socket'
import { detectHandoverIntent } from '@/lib/openai'
import { normalizePhoneNumber } from '@/lib/whatsapp/helpers'
import { AutomationEngine } from '@/lib/automations'
import { humanizeResponse, calculateTypingDelay } from '@/lib/humanizer'
import { generateLLMCompletion, ChatMessage } from '@/lib/llm'
import { getLLMConfig, getAgentConfig, getWhatsAppConfig } from '@/lib/settings'
import { transcribeAudio, analyzeImage, downloadEvolutionMedia } from '@/lib/media'
import { StageDetectionEngine } from '@/lib/stage-detection-engine'
import { RecurringClientService } from '@/lib/recurring-client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Supported message types
const SUPPORTED_TEXT_TYPES = ['conversation', 'extendedTextMessage']
const SUPPORTED_AUDIO_TYPES = ['audioMessage', 'pttMessage'] // ptt = push to talk (voice message)
const SUPPORTED_IMAGE_TYPES = ['imageMessage']

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

        // Check if message type is supported
        const isTextMessage = SUPPORTED_TEXT_TYPES.includes(messageType)
        const isAudioMessage = SUPPORTED_AUDIO_TYPES.includes(messageType)
        const isImageMessage = SUPPORTED_IMAGE_TYPES.includes(messageType)

        if (!isTextMessage && !isAudioMessage && !isImageMessage) {
            console.log('[Webhook] Ignoring unsupported message type:', messageType)
            return NextResponse.json({ success: true, message: 'Ignored unsupported message type' })
        }

        // Extract phone number
        const fromPhone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') ||
            messageData.from?.replace('@s.whatsapp.net', '') ||
            messageData.remoteJid?.replace('@s.whatsapp.net', '')

        // Extract message content based on type
        let messageText = ''
        let mediaProcessed = false

        if (isTextMessage) {
            messageText = messageData.message?.conversation ||
                messageData.message?.extendedTextMessage?.text ||
                messageData.body ||
                messageData.text || ''
        } else if (isAudioMessage) {
            console.log('[Webhook] Processing audio message...')
            // Get audio URL or base64
            const audioData = messageData.message?.audioMessage
            if (audioData) {
                // Try to get media URL from Evolution API
                const mediaUrl = audioData.url || messageData.media?.url
                if (mediaUrl) {
                    try {
                        messageText = await transcribeAudio(mediaUrl)
                        mediaProcessed = true
                        console.log('[Webhook] Audio transcribed:', messageText.substring(0, 100))
                    } catch (error) {
                        console.error('[Webhook] Audio transcription failed:', error)
                        messageText = '[Mensagem de áudio recebida - transcrição não disponível]'
                    }
                } else {
                    messageText = '[Mensagem de áudio recebida]'
                }
            }
        } else if (isImageMessage) {
            console.log('[Webhook] Processing image message...')
            const imageData = messageData.message?.imageMessage
            if (imageData) {
                const mediaUrl = imageData.url || messageData.media?.url
                const caption = imageData.caption || ''
                if (mediaUrl) {
                    try {
                        const analysis = await analyzeImage(mediaUrl)
                        messageText = caption ? `${caption}\n\n[Análise da imagem: ${analysis}]` : `[Imagem: ${analysis}]`
                        mediaProcessed = true
                        console.log('[Webhook] Image analyzed:', analysis.substring(0, 100))
                    } catch (error) {
                        console.error('[Webhook] Image analysis failed:', error)
                        messageText = caption || '[Imagem recebida - análise não disponível]'
                    }
                } else {
                    messageText = caption || '[Imagem recebida]'
                }
            }
        }

        // Extract pushName (WhatsApp profile name)
        const pushName = messageData.pushName || data.body?.pushName || ''
        const formattedName = pushName
            ? pushName.split(' ').filter((w: string) => w).map((word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
            : ''

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
                    nome: formattedName || fromPhone, // Use WhatsApp name if available
                    telefone: fromPhone,
                    telefoneNormalizado: normalizedPhone,
                    canal: 'WhatsApp',
                    status: 'Novo Lead',
                    estagio: 'Novo Lead',
                    ultimaMensagem: messageText,
                    dataUltimaMensagem: new Date(),
                }
            })
            console.log('[Webhook] Created new lead:', lead.id, 'Name:', formattedName || fromPhone)

            // Trigger automation: Lead Created
            await AutomationEngine.trigger('lead_created', {
                leadId: lead.id,
                userId: lead.userId || undefined // Might be null initially
            })
        } else {
            // Check if it's a recurring client (existing lead returning)
            const tenantId = lead.tenantId || 'default'
            const recurringCheck = await RecurringClientService.checkRecurringClient(normalizedPhone, tenantId)

            if (recurringCheck.isRecurring && lead.estagio === 'Fechado' || lead.estagio === 'Pós-Venda') {
                // Process as recurring client - create new record
                const recurringResult = await RecurringClientService.processRecurringClient(
                    normalizedPhone,
                    tenantId,
                    lead.assignedTo || undefined
                )

                if (recurringResult.newLead) {
                    lead = recurringResult.newLead
                    console.log('[Webhook] Processed recurring client, new lead:', lead.id)
                }
            } else {
                // Update last message for existing lead
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: {
                        ultimaMensagem: messageText,
                        dataUltimaMensagem: new Date(),
                        lastContactAt: new Date(),
                    }
                })
            }
            console.log('[Webhook] Updated existing lead:', lead.id)
        }

        // Detect stage change triggers from message
        const stageDetection = await StageDetectionEngine.processAndUpdateLead(
            lead.id,
            messageText,
            lead.estagio,
            lead
        )

        if (stageDetection.detected) {
            console.log(`[Webhook] Stage change detected: ${lead.estagio} -> ${stageDetection.newStage}`)
            // Refresh lead data after stage update
            lead = await prisma.lead.findUnique({ where: { id: lead.id } }) || lead
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
            const ioHandover = getIO()
            if (ioHandover) {
                ioHandover.to(`lead:${lead.id}`).emit('chat:new_message', {
                    leadId: lead.id,
                    message: handoverMessage,
                    sender: 'ai',
                    senderType: 'ai',
                    timestamp: new Date().toISOString(),
                })

                ioHandover.emit('handover:new_request', {
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

        // Generate AI response using configured LLM provider
        console.log('[Webhook] Generating AI response...')

        // Get tenant ID from lead if available
        const tenantId = lead.tenantId || undefined

        // Load LLM config for this tenant
        const llmConfig = await getLLMConfig(tenantId)
        console.log(`[Webhook] Using LLM provider: ${llmConfig.provider}, model: ${llmConfig.model}`)

        const leadContext = {
            nome: lead.nome,
            destino: lead.destino || undefined,
            orcamento: lead.orcamento || undefined,
            dataPartida: lead.dataPartida?.toISOString() || undefined,
            dataRetorno: lead.dataRetorno?.toISOString() || undefined,
            pessoas: lead.pessoas || undefined,
        }

        // Build context message
        const contextMessage = leadContext.nome !== fromPhone
            ? `[Contexto: Cliente ${leadContext.nome}${leadContext.destino ? `, interessado em ${leadContext.destino}` : ''}]`
            : ''

        // Prepare messages for LLM
        const llmMessages: ChatMessage[] = messages.slice(-10).map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }))

        // Add context to first message if available
        if (contextMessage && llmMessages.length > 0) {
            llmMessages[0].content = `${contextMessage}\n\n${llmMessages[0].content}`
        }

        const aiResponse = await generateLLMCompletion(llmMessages, llmConfig, tenantId)

        console.log('[Webhook] AI response generated:', aiResponse.substring(0, 100))

        // Split response into natural messages using humanizer
        const humanizedMessages = humanizeResponse(aiResponse)
        console.log(`[Webhook] Sending ${humanizedMessages.length} humanized messages`)

        // Send each message with typing delay
        for (let i = 0; i < humanizedMessages.length; i++) {
            const msg = humanizedMessages[i]
            await whatsapp.sendTextMessage({
                number: normalizedPhone,
                message: msg,
            })

            // Add delay between messages (except last)
            if (i < humanizedMessages.length - 1) {
                const delay = calculateTypingDelay(msg)
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        // Add AI response to history
        messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
        })

        // Emit socket event for AI response
        const ioAi = getIO()
        if (ioAi) {
            ioAi.to(`lead:${lead.id}`).emit('chat:new_message', {
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
