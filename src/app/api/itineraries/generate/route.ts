import { NextRequest, NextResponse } from 'next/server'
import { generateItinerary } from '@/lib/openai'
import { db } from '@/lib/db'
import { getGooglePlacesService } from '@/lib/integrations/googlePlaces'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      leadId,
      userId,
      destino,
      dataPartida,
      dataRetorno,
      orcamento,
      pessoas,
      perfil,
      preferencias,
    } = body

    // Validation
    if (!destino || !dataPartida || !dataRetorno) {
      return NextResponse.json(
        { error: 'Destino, data de partida e data de retorno são obrigatórios' },
        { status: 400 }
      )
    }

    // Generate itinerary using AI
    const aiItinerary = await generateItinerary({
      destino,
      dataPartida,
      dataRetorno,
      orcamento,
      pessoas,
      perfil,
      preferencias,
    })

    // Parse dates
    const startDate = new Date(dataPartida)
    const endDate = new Date(dataRetorno)
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Try to get destination info from Google Places
    let destinationInfo
    try {
      const placesService = getGooglePlacesService()
      destinationInfo = await placesService.getDestinationOverview(destino)
    } catch (error) {
      console.log('Could not fetch destination info:', error)
    }

    // Structure the itinerary content
    const structuredContent = {
      aiGeneratedContent: aiItinerary,
      destination: destinationInfo?.destination || {
        name: destino,
        coordinates: null,
      },
      topAttractions: destinationInfo?.topAttractions || [],
      topRestaurants: destinationInfo?.topRestaurants || [],
      days: Array.from({ length: days }, (_, i) => ({
        dayNumber: i + 1,
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
        activities: [],
      })),
    }

    // Save to database
    const itinerary = await db.itinerary.create({
      data: {
        leadId: leadId || undefined,
        userId: userId || 'system', // TODO: Get from session
        title: `Roteiro: ${destino}`,
        destination: destino,
        startDate,
        endDate,
        budget: orcamento,
        travelers: pessoas,
        tripType: perfil,
        preferences: preferencias,
        content: JSON.stringify(structuredContent),
        status: 'draft',
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        itinerary,
        aiContent: aiItinerary,
        destinationInfo,
      },
    })
  } catch (error: any) {
    console.error('Itinerary Generation Error:', error)

    return NextResponse.json(
      {
        error: 'Erro ao gerar roteiro',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where: any = {}
    if (leadId) where.leadId = leadId
    if (userId) where.userId = userId
    if (status) where.status = status

    const itineraries = await db.itinerary.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: itineraries,
    })
  } catch (error: any) {
    console.error('Error fetching itineraries:', error)

    return NextResponse.json(
      { error: 'Erro ao buscar roteiros' },
      { status: 500 }
    )
  }
}
