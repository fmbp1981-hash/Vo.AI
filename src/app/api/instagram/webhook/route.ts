import { NextRequest, NextResponse } from 'next/server'
import { getIO } from '@/lib/socket'
import { detectHandoverIntent } from '@/lib/openai'
import { AutomationEngine } from '@/lib/automations'
import { humanizeResponse, calculateTypingDelay } from '@/lib/humanizer'
import { generateLLMCompletion, ChatMessage } from '@/lib/llm'
import { getLLMConfig, getAgentConfig } from '@/lib/settings'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

/**
 * Webhook handler for incoming Instagram messages via Meta Graph API
 * POST /api/instagram/webhook
 * 
 * Setup: 
 * 1. Create a Meta App at developers.facebook.com
 * 2. Add Instagram Basic Display and Instagram Graph API products
 * 3. Configure webhook URL: https://your-domain.com/api/instagram/webhook
 * 4. Subscribe to messages webhook field
 */

// Webhook verification (GET request from Meta)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'voai_instagram_verify'

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('[Instagram Webhook] Verified successfully')
        return new NextResponse(challenge, { status: 200 })
    }

    console.log('[Instagram Webhook] Verification failed')
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// Handle incoming messages (POST request from Meta)
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        console.log('[Instagram Webhook] Received:', JSON.stringify(data, null, 2))

        // Meta sends messages in this format
        const entry = data.entry?.[0]
        if (!entry) {
            return NextResponse.json({ success: true, message: 'No entry' })
        }

        // Check for messaging events
        const messaging = entry.messaging?.[0]
        if (!messaging) {
            return NextResponse.json({ success: true, message: 'No messaging' })
        }

        // Ignore echo messages (messages sent by us)
        if (messaging.message?.is_echo) {
            console.log('[Instagram Webhook] Ignoring echo message')
            return NextResponse.json({ success: true, message: 'Ignored echo' })
        }

        // Extract sender and message
        const senderId = messaging.sender?.id
        const messageText = messaging.message?.text
        const timestamp = messaging.timestamp

        if (!senderId || !messageText) {
            console.log('[Instagram Webhook] Missing sender or message')
            return NextResponse.json({ success: true, message: 'Missing data' })
        }

        console.log(`[Instagram Webhook] Message from ${senderId}: "${messageText}"`)

        // Get sender profile from Instagram
        let senderName = `Instagram_${senderId}`
        try {
            const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
            if (accessToken) {
                const profileResponse = await axios.get(
                    `https://graph.facebook.com/v18.0/${senderId}`,
                    { params: { fields: 'name,username', access_token: accessToken } }
                )
                senderName = profileResponse.data?.name || profileResponse.data?.username || senderName
            }
        } catch (error) {
            console.log('[Instagram Webhook] Could not fetch sender profile')
        }

        // Get or create lead
        let lead = await prisma.lead.findFirst({
            where: {
                OR: [
                    { instagramId: senderId },
                    { telefone: `instagram_${senderId}` }
                ]
            }
        })

        if (!lead) {
            lead = await prisma.lead.create({
                data: {
                    nome: senderName,
                    telefone: `instagram_${senderId}`,
                    instagramId: senderId,
                    canal: 'Instagram',
                    status: 'Novo Lead',
                    estagio: 'Novo Lead',
                    ultimaMensagem: messageText,
                    dataUltimaMensagem: new Date(),
                }
            })
            console.log('[Instagram Webhook] Created new lead:', lead.id)

            // Trigger automation
            await AutomationEngine.trigger('lead_created', {
                leadId: lead.id,
                userId: lead.userId || undefined
            })
        } else {
            await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    ultimaMensagem: messageText,
                    dataUltimaMensagem: new Date(),
                    lastContactAt: new Date(),
                }
            })
            console.log('[Instagram Webhook] Updated existing lead:', lead.id)
        }

        // Get or create conversation
        let conversation = await prisma.conversation.findFirst({
            where: {
                leadId: lead.id,
                channel: 'instagram',
                status: { not: 'closed' },
            }
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    leadId: lead.id,
                    tenantId: lead.tenantId || 'default',
                    channel: 'instagram',
                    status: 'active',
                    messages: JSON.stringify([]),
                }
            })
            console.log('[Instagram Webhook] Created new conversation:', conversation.id)
        }

        // Parse existing messages
        let messages: any[] = []
        try {
            messages = typeof conversation.messages === 'string'
                ? JSON.parse(conversation.messages)
                : conversation.messages || []
        } catch (e) {
            messages = []
        }

        // Add user message
        messages.push({
            role: 'user',
            content: messageText,
            timestamp: new Date(timestamp * 1000).toISOString(),
            channel: 'instagram',
        })

        // Emit socket event for UI
        const io = getIO()
        if (io) {
            io.to(`lead:${lead.id}`).emit('chat:new_message', {
                leadId: lead.id,
                message: messageText,
                sender: senderName,
                senderType: 'customer',
                channel: 'instagram',
                timestamp: new Date().toISOString(),
            })
        }

        // Check if conversation is in handover mode
        if (conversation.status === 'handover') {
            console.log('[Instagram Webhook] Conversation in handover mode, skipping AI')
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { messages: JSON.stringify(messages) }
            })
            return NextResponse.json({ success: true, handover: true })
        }

        // Check for handover intent
        const handoverCheck = await detectHandoverIntent(messageText)
        if (handoverCheck.isHandover) {
            console.log('[Instagram Webhook] Handover intent detected')

            await prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'handover',
                    messages: JSON.stringify(messages)
                }
            })

            const agentConfig = await getAgentConfig(lead.tenantId || undefined)
            const handoverMessage = agentConfig.handoverMessage

            // Send handover message via Instagram
            await sendInstagramMessage(senderId, handoverMessage)

            messages.push({
                role: 'assistant',
                content: handoverMessage,
                timestamp: new Date().toISOString(),
                channel: 'instagram',
            })

            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { messages: JSON.stringify(messages) }
            })

            return NextResponse.json({ success: true, handover: true })
        }

        // Generate AI response
        console.log('[Instagram Webhook] Generating AI response...')

        const tenantId = lead.tenantId || undefined
        const llmConfig = await getLLMConfig(tenantId)
        console.log(`[Instagram Webhook] Using LLM: ${llmConfig.provider}`)

        const llmMessages: ChatMessage[] = messages.slice(-10).map((m: any) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        }))

        const aiResponse = await generateLLMCompletion(llmMessages, llmConfig, tenantId)
        console.log('[Instagram Webhook] AI response:', aiResponse.substring(0, 100))

        // Humanize and send response
        const humanizedMessages = humanizeResponse(aiResponse)
        console.log(`[Instagram Webhook] Sending ${humanizedMessages.length} messages`)

        for (let i = 0; i < humanizedMessages.length; i++) {
            await sendInstagramMessage(senderId, humanizedMessages[i])

            if (i < humanizedMessages.length - 1) {
                const delay = calculateTypingDelay(humanizedMessages[i])
                await new Promise(resolve => setTimeout(resolve, delay))
            }
        }

        // Add AI response to history
        messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
            channel: 'instagram',
        })

        // Emit socket event for AI response
        if (io) {
            io.to(`lead:${lead.id}`).emit('chat:new_message', {
                leadId: lead.id,
                message: aiResponse,
                sender: 'ai',
                senderType: 'ai',
                channel: 'instagram',
                timestamp: new Date().toISOString(),
            })
        }

        // Save conversation
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                messages: JSON.stringify(messages),
                lastAiMessageAt: new Date(),
            }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('[Instagram Webhook] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * Send a message via Instagram Graph API
 */
async function sendInstagramMessage(recipientId: string, message: string): Promise<boolean> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const pageId = process.env.INSTAGRAM_PAGE_ID

    if (!accessToken || !pageId) {
        console.warn('[Instagram] Access token or Page ID not configured')
        return false
    }

    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${pageId}/messages`,
            {
                recipient: { id: recipientId },
                message: { text: message }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                params: { access_token: accessToken }
            }
        )
        console.log('[Instagram] Message sent successfully')
        return true
    } catch (error: any) {
        console.error('[Instagram] Send message error:', error.response?.data || error.message)
        return false
    }
}
