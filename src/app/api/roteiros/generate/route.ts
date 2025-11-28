import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { destination, startDate, endDate, budget, travelers, tripType, preferences, specialRequests } = body

    // Validate required fields
    if (!destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Destino, data de início e data de fim são obrigatórios' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Create the prompt for itinerary generation
    const prompt = `Como um especialista em turismo da AGIR Viagens, gere um roteiro detalhado e personalizado para:

Destino: ${destination}
Período: ${startDate} a ${endDate}
Orçamento: ${budget || 'Não especificado'}
Viajantes: ${travelers || 'Não especificado'}
Tipo de viagem: ${tripType || 'Não especificado'}
Preferências: ${preferences || 'Não especificado'}
Requisitos especiais: ${specialRequests || 'Nenhum'}

IMPORTANTE:
1. Gere um roteiro realista e acionável
2. Inclua horários específicos para cada atividade
3. Forneça custos estimados realistas em reais (R$)
4. Inclua transporte, hospedagem, refeições e passeios
5. Considere o tempo de deslocamento entre locais
6. Adapte as atividades ao perfil dos viajantes
7. Inclua dicas e recomendações locais

Responda em formato JSON com a seguinte estrutura:
{
  "title": "Título do roteiro",
  "summary": "Breve resumo da viagem",
  "totalCost": custo total estimado,
  "days": [
    {
      "day": número do dia,
      "date": "YYYY-MM-DD",
      "title": "Título do dia",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Título da atividade",
          "description": "Descrição detalhada",
          "location": "Local específico",
          "type": "transport|accommodation|meal|sightseeing|shopping|other",
          "cost": custo estimado em reais,
          "duration": "duração estimada",
          "tips": "dicas importantes"
        }
      ]
    }
  ]
}`

    // Generate itinerary using ZAI
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em turismo da AGIR Viagens com vasta experiência em criar roteiros personalizados. Suas respostas devem ser sempre em formato JSON válido e conter informações práticas e acionáveis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const responseContent = completion.choices[0]?.message?.content
    
    if (!responseContent) {
      throw new Error('Não foi possível gerar o roteiro')
    }

    // Try to parse the JSON response
    let itineraryData
    try {
      itineraryData = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Failed to parse ZAI response:', parseError)
      throw new Error('Resposta da IA inválida')
    }

    // Add metadata
    itineraryData.metadata = {
      generatedAt: new Date().toISOString(),
      requestId: crypto.randomUUID(),
      inputData: {
        destination,
        startDate,
        endDate,
        budget,
        travelers,
        tripType,
        preferences,
        specialRequests
      }
    }

    return NextResponse.json({
      success: true,
      data: itineraryData
    })

  } catch (error: any) {
    console.error('Error generating itinerary:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar roteiro',
        details: error.message || 'Tente novamente em alguns minutos'
      },
      { status: 500 }
    )
  }
}