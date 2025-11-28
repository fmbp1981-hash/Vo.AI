import { NextRequest } from 'next/server'
import { generateStreamingCompletion } from '@/lib/openai'
import { db } from '@/lib/db'
import { withRateLimit, rateLimitPresets } from '@/lib/rate-limit'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, leadId, messages = [] } = body

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

    // Prepare messages for OpenAI
    const chatMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      }
    ]

    // Generate streaming AI response
    const stream = await generateStreamingCompletion({
      messages: chatMessages,
      leadContext,
      temperature: 0.7,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = `data: ${JSON.stringify({ content: chunk })}\n\n`
            controller.enqueue(encoder.encode(text))
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Chat Stream API Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Erro ao processar mensagem',
        details: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
