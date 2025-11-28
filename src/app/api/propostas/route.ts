import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leadId = searchParams.get('leadId')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    let whereClause = {}
    if (status) {
      whereClause = { ...whereClause, status }
    }
    if (leadId) {
      whereClause = { ...whereClause, leadId }
    }

    const proposals = await db.proposal.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
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

    // Group proposals by status
    const proposalStats = proposals.reduce((acc, proposal) => {
      const status = proposal.status
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        proposals,
        stats: proposalStats,
        total: proposals.length
      }
    })

  } catch (error: any) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao buscar propostas',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      leadId,
      userId,
      title,
      content,
      totalValue,
      terms,
      notes,
      ...otherFields
    } = body

    // Validate required fields
    if (!leadId || !userId || !title || !content) {
      return NextResponse.json(
        { error: 'Lead, usuário, título e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if lead exists
    const lead = await db.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Create new proposal
    const newProposal = await db.proposal.create({
      data: {
        leadId,
        userId,
        title,
        content: JSON.stringify(content),
        totalValue,
        terms,
        notes,
        status: 'draft',
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
        userId,
        type: 'create_proposal',
        description: `Proposta "${title}" criada para ${lead.nome}`,
        metadata: JSON.stringify({
          proposalId: newProposal.id,
          leadId,
          leadName: lead.nome
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: newProposal
    })

  } catch (error: any) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao criar proposta',
        details: error.message 
      },
      { status: 500 }
    )
  }
}