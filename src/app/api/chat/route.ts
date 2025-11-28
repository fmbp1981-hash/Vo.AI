import { NextRequest, NextResponse } from 'next/server'
import { generateChatCompletion, detectHandoverIntent, extractLeadInfo } from '@/lib/openai'
import { db } from '@/lib/db'
import { cache, cacheKeys } from '@/lib/redis'
import { withRateLimit, rateLimitPresets } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  return withRateLimit(
    request,
    handleChatRequest,
    rateLimitPresets.chat
  )
}

async function handleChatRequest(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const { message, leadId, conversationId, messages = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    // Create cache key for similar messages
    const messageHash = crypto
      .createHash('md5')
      .update(message.toLowerCase().trim())
      .digest('hex')
    
    const cacheKey = cacheKeys.aiResponse(messageHash)

    // Check cache for common questions (TTL: 1 hour)
    const cachedResponse = await cache.get<string>(cacheKey)
    if (cachedResponse && !leadId) {
      console.log('✅ Cache hit for message:', message.substring(0, 50))
      return NextResponse.json({
        success: true,
        data: {
          message: cachedResponse,
          cached: true,
        },
      })
    }

    // Get lead context if available
    let leadContext
    if (leadId) {
      const lead = await db.lead.findUnique({
        where: { id: leadId },
      })
      leadContext = lead ? {
        nome: lead.nome,
        destino: lead.destino || undefined,
        orcamento: lead.orcamento || undefined,
        dataPartida: lead.dataPartida?.toISOString(),
        dataRetorno: lead.dataRetorno?.toISOString(),
        pessoas: lead.pessoas || undefined,
      } : undefined
    }

    // Check for handover intent
    const handoverDetection = detectHandoverIntent(message)

    // Prepare messages for OpenAI
    const chatMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      }
    ]

    // Generate AI response
    const aiResponse = await generateChatCompletion({
      messages: chatMessages,
      leadContext,
      temperature: 0.7,
    })

    // Save conversation to database
    let conversation
    if (conversationId) {
      // Update existing conversation
      const existingConv = await db.conversation.findUnique({
        where: { id: conversationId },
      })

      if (existingConv) {
        const messagesArray = JSON.parse(existingConv.messages || '[]')
        messagesArray.push(
          {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
          },
          {
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString(),
          }
        )

        conversation = await db.conversation.update({
          where: { id: conversationId },
          data: {
            messages: JSON.stringify(messagesArray),
            status: handoverDetection.shouldHandover ? 'waiting' : 'active',
            updatedAt: new Date(),
          },
        })
      }
    } else if (leadId) {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          leadId,
          channel: 'webchat',
          messages: JSON.stringify([
            {
              role: 'user',
              content: message,
              timestamp: new Date().toISOString(),
            },
            {
              role: 'assistant',
              content: aiResponse,
              timestamp: new Date().toISOString(),
            },
          ]),
          status: handoverDetection.shouldHandover ? 'waiting' : 'active',
        },
      })
    }

    // Extract and update lead information
    if (leadId && messages.length >= 2) {
      const fullConversation = [...messages, { role: 'user', content: message }]
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Vo.AI'}: ${m.content}`)
        .join('\n')

      const extractedInfo = await extractLeadInfo(fullConversation)
      
      if (Object.keys(extractedInfo).length > 0) {
        await db.lead.update({
          where: { id: leadId },
          data: {
            ...extractedInfo,
            dataPartida: extractedInfo.dataPartida ? new Date(extractedInfo.dataPartida) : undefined,
            dataRetorno: extractedInfo.dataRetorno ? new Date(extractedInfo.dataRetorno) : undefined,
            updatedAt: new Date(),
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
        conversationId: conversation?.id,
        handover: handoverDetection.shouldHandover ? {
          should: true,
          reason: handoverDetection.reason,
          confidence: handoverDetection.confidence,
        } : undefined,
      },
    })

  } catch (error: any) {
    console.error('Chat API Error:', error)
    
    // Fallback response if OpenAI fails
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar mensagem',
      data: {
        message: 'Desculpe, estou com dificuldades no momento. Um consultor humano entrará em contato em breve! 😊',
        fallback: true,
      },
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')
    const leadId = searchParams.get('leadId')

    if (!conversationId && !leadId) {
      return NextResponse.json(
        { error: 'conversationId ou leadId é obrigatório' },
        { status: 400 }
      )
    }

    let conversations
    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          lead: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversa não encontrada' },
          { status: 404 }
        )
      }

      conversations = [conversation]
    } else {
      conversations = await db.conversation.findMany({
        where: { leadId: leadId! },
        orderBy: { createdAt: 'desc' },
        include: {
          lead: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: conversations,
    })

  } catch (error: any) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar conversas' },
      { status: 500 }
    )
  }
}
