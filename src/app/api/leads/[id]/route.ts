import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import followUpService from '@/lib/followUpService'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const {
      estagio,
      assignedTo,
      score,
      qualificado,
      recorrente,
      dataFechamento,
      motivoCancelamento,
      observacoes,
      ...otherFields
    } = body

    // Check if lead exists
    const existingLead = await db.lead.findUnique({
      where: { id }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Update lead
    const updatedLead = await db.lead.update({
      where: { id },
      data: {
        estagio,
        assignedTo,
        score,
        qualificado,
        recorrente,
        dataFechamento: dataFechamento ? new Date(dataFechamento) : undefined,
        motivoCancelamento,
        observacoes,
        updatedAt: new Date(),
        // Set dataFechamento when stage is 'Fechado'
        ...(estagio === 'Fechado' && !dataFechamento && { 
          dataFechamento: new Date() 
        }),
        // Clear dataFechamento when moving away from 'Fechado'
        ...(estagio !== 'Fechado' && { 
          dataFechamento: null 
        }),
        ...otherFields
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log the activity
    await db.activity.create({
      data: {
        userId: assignedTo || 'system',
        type: 'update_lead_stage',
        description: `Lead ${updatedLead.nome} movido de ${existingLead.estagio} para ${estagio}`,
        metadata: JSON.stringify({
          leadId: id,
          oldStage: existingLead.estagio,
          newStage: estagio,
          updatedFields: Object.keys(body)
        })
      }
    })

    // TRIGGER: Enviar confirmação quando mudar para "Fechado"
    if (estagio === 'Fechado' && existingLead.estagio !== 'Fechado') {
      try {
        await followUpService.sendClosureConfirmation(id)
        console.log(`✅ Confirmação de fechamento enviada para ${updatedLead.nome}`)
      } catch (error: any) {
        console.error('❌ Erro ao enviar confirmação:', error.message)
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLead
    })

  } catch (error: any) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar lead',
        details: error.message 
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
    const { id } = params

    const lead = await db.lead.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        itineraries: {
          orderBy: { createdAt: 'desc' },
          take: 3
        },
        proposals: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lead
    })

  } catch (error: any) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar lead',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params })
}