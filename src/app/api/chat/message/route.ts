import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, leadId, conversationHistory, channel } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create system prompt for travel assistant
    const systemPrompt = `Você é um assistente de IA especializado em turismo da AGIR Viagens. Suas características:

- Especialista em destinos nacionais e internacionais
- Conhecedor de pacotes, roteiros e serviços da AGIR
- Prestativo, profissional e amigável
- Focado em converter leads em clientes
- Capaz de identificar intenções de compra
- Sempre busca agendar reuniões ou gerar propostas

Diretrizes:
1. Responda de forma natural e conversacional
2. Seja proativo em sugerir pacotes e roteiros
3. Identifique quando o cliente está pronto para proposta
4. Ofereça ajuda personalizada baseada no perfil
5. Mantenha o tom profissional mas acolhedor
6. Seja breve e direto nas respostas
7. Sempre busque qualificar o lead

Se não souber alguma informação específica, seja honesto e ofereça conectar com um consultor humano.`

    // Format conversation history
    const formattedHistory = conversationHistory?.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    })) || []

    // Create messages array
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...formattedHistory,
      {
        role: 'user',
        content: message
      }
    ]

    // Generate response using ZAI
    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.8,
      max_tokens: 500
    })

    const responseContent = completion.choices[0]?.message?.content
    
    if (!responseContent) {
      throw new Error('Não foi possível gerar resposta')
    }

    // Analyze intent and suggest actions
    const intentAnalysis = analyzeIntent(message, responseContent)

    return NextResponse.json({
      success: true,
      data: {
        message: responseContent,
        intent: intentAnalysis.intent,
        suggestedActions: intentAnalysis.actions,
        shouldEscalate: intentAnalysis.shouldEscalate,
        leadQualification: intentAnalysis.qualification
      }
    })

  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar mensagem',
        details: error.message || 'Tente novamente em alguns minutos'
      },
      { status: 500 }
    )
  }
}

function analyzeIntent(userMessage: string, aiResponse: string) {
  const message = userMessage.toLowerCase()
  const response = aiResponse.toLowerCase()
  
  // Intent analysis
  let intent = 'general'
  let shouldEscalate = false
  let actions: string[] = []
  let qualification = 'initial'

  // Check for purchase intent
  if (message.includes('quanto custa') || message.includes('preço') || message.includes('valor')) {
    intent = 'pricing'
    qualification = 'considering'
    actions.push('generate_proposal', 'schedule_call')
  }

  if (message.includes('quero comprar') || message.includes('fechar') || message.includes('contratar')) {
    intent = 'purchase'
    qualification = 'ready_to_buy'
    shouldEscalate = true
    actions.push('escalate_to_human', 'generate_proposal')
  }

  if (message.includes('agendar') || message.includes('marcar') || message.includes('reunião')) {
    intent = 'scheduling'
    qualification = 'interested'
    actions.push('schedule_meeting')
  }

  if (message.includes('roteiro') || message.includes('itinerário') || message.includes('programa')) {
    intent = 'itinerary'
    qualification = 'planning'
    actions.push('generate_itinerary')
  }

  // Check for escalation needs
  if (message.includes('reclamação') || message.includes('problema') || message.includes('insatisfeito')) {
    shouldEscalate = true
    actions.push('escalate_to_human')
  }

  // Check for complex requests
  if (message.includes('personalizado') || message.includes('especial') || message.includes('diferente')) {
    actions.push('escalate_to_human')
  }

  return {
    intent,
    shouldEscalate,
    actions,
    qualification
  }
}