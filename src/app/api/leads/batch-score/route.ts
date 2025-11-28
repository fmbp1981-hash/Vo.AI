import { NextRequest, NextResponse } from 'next/server'
import { batchUpdateLeadScores } from '@/lib/leadScoring'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadIds } = body

    const result = await batchUpdateLeadScores(leadIds)

    return NextResponse.json({
      success: true,
      data: result,
      message: `${result.updated} leads atualizados com sucesso. ${result.errors} erros.`,
    })

  } catch (error: any) {
    console.error('Error batch updating lead scores:', error)

    return NextResponse.json(
      {
        error: 'Erro ao atualizar scores em lote',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
