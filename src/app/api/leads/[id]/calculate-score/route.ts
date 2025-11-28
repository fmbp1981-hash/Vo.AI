import { NextRequest, NextResponse } from 'next/server'
import { updateLeadScore, calculateLeadScoreFromDB } from '@/lib/leadScoring'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      )
    }

    const result = await updateLeadScore(leadId)

    return NextResponse.json({
      success: true,
      data: result,
    })

  } catch (error: any) {
    console.error('Error calculating lead score:', error)

    return NextResponse.json(
      {
        error: 'Erro ao calcular score do lead',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!leadId) {
      return NextResponse.json(
        { error: 'ID do lead é obrigatório' },
        { status: 400 }
      )
    }

    const breakdown = await calculateLeadScoreFromDB(leadId)

    return NextResponse.json({
      success: true,
      data: breakdown,
    })

  } catch (error: any) {
    console.error('Error getting lead score:', error)

    return NextResponse.json(
      {
        error: 'Erro ao obter score do lead',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
