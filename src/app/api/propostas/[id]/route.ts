import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id } = params

    const {
      title,
      content,
      totalValue,
      status,
      terms,
      notes,
      pdfUrl,
      sentAt,
      viewedAt,
      signedAt,
      ...otherFields
    } = body

    // Check if proposal exists
    const existingProposal = await db.proposal.findUnique({
      where: { id }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Update proposal
    const updatedProposal = await db.proposal.update({
      where: { id },
      data: {
        title,
        content: content ? JSON.stringify(content) : undefined,
        totalValue,
        status,
        terms,
        notes,
        pdfUrl,
        sentAt: sentAt ? new Date(sentAt) : undefined,
        viewedAt: viewedAt ? new Date(viewedAt) : undefined,
        signedAt: signedAt ? new Date(signedAt) : undefined,
        updatedAt: new Date(),
        ...otherFields
      },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await db.activity.create({
      data: {
        userId: updatedProposal.userId,
        type: 'update_proposal',
        description: `Proposta "${updatedProposal.title}" atualizada`,
        metadata: JSON.stringify({
          proposalId: id,
          oldStatus: existingProposal.status,
          newStatus: status,
          updatedFields: Object.keys(body)
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedProposal
    })

  } catch (error: any) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar proposta',
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

    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            destino: true,
            dataPartida: true,
            dataRetorno: true,
            orcamento: true,
            pessoas: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Parse content if it's a JSON string
    let parsedContent = proposal.content
    if (typeof proposal.content === 'string') {
      try {
        parsedContent = JSON.parse(proposal.content)
      } catch (e) {
        // Keep as is if it's not valid JSON
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...proposal,
        content: parsedContent
      }
    })

  } catch (error: any) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar proposta',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if proposal exists
    const existingProposal = await db.proposal.findUnique({
      where: { id }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Delete proposal
    await db.proposal.delete({
      where: { id }
    })

    // Log activity
    await db.activity.create({
      data: {
        userId: existingProposal.userId,
        type: 'delete_proposal',
        description: `Proposta "${existingProposal.title}" excluída`,
        metadata: JSON.stringify({
          proposalId: id,
          proposalTitle: existingProposal.title
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Proposta excluída com sucesso'
    })

  } catch (error: any) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao excluir proposta',
        details: error.message 
      },
      { status: 500 }
    )
  }
}