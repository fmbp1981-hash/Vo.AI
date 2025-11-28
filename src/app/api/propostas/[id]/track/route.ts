import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Track proposal views
 * This endpoint is called when a proposal PDF is opened
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id

    if (!proposalId) {
      return NextResponse.json(
        { error: 'ID da proposta é obrigatório' },
        { status: 400 }
      )
    }

    // Get client info for tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'Unknown'

    // Find the proposal
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Update viewedAt if first view
    const updates: any = {
      updatedAt: new Date(),
    }

    if (!proposal.viewedAt) {
      updates.viewedAt = new Date()
      updates.status = 'viewed'
    }

    // Update proposal
    const updatedProposal = await db.proposal.update({
      where: { id: proposalId },
      data: updates,
    })

    // Log view activity
    await db.activity.create({
      data: {
        userId: proposal.userId,
        type: 'view_proposal',
        description: `Proposta ${proposalId} visualizada`,
        metadata: JSON.stringify({
          proposalId,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        }),
        ipAddress: ip,
        userAgent,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        proposal: updatedProposal,
        tracked: true,
        firstView: !proposal.viewedAt,
      },
    })
  } catch (error: any) {
    console.error('Proposal Tracking Error:', error)

    return NextResponse.json(
      {
        error: 'Erro ao rastrear visualização',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Get proposal tracking analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = params.id

    // Get proposal
    const proposal = await db.proposal.findUnique({
      where: { id: proposalId },
      include: {
        lead: {
          select: {
            nome: true,
            email: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposta não encontrada' },
        { status: 404 }
      )
    }

    // Get view activities
    const viewActivities = await db.activity.findMany({
      where: {
        type: 'view_proposal',
        metadata: {
          contains: proposalId,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate analytics
    const analytics = {
      totalViews: viewActivities.length,
      firstViewedAt: proposal.viewedAt,
      lastViewedAt: viewActivities[0]?.createdAt,
      status: proposal.status,
      sentAt: proposal.sentAt,
      signedAt: proposal.signedAt,
      timeToFirstView: proposal.sentAt && proposal.viewedAt
        ? Math.round((proposal.viewedAt.getTime() - proposal.sentAt.getTime()) / 1000 / 60) // minutes
        : null,
      timeToSign: proposal.viewedAt && proposal.signedAt
        ? Math.round((proposal.signedAt.getTime() - proposal.viewedAt.getTime()) / 1000 / 60 / 60) // hours
        : null,
      views: viewActivities.map(v => ({
        timestamp: v.createdAt,
        ip: v.ipAddress,
        userAgent: v.userAgent,
      })),
    }

    return NextResponse.json({
      success: true,
      data: {
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          totalValue: proposal.totalValue,
          lead: proposal.lead,
        },
        analytics,
      },
    })
  } catch (error: any) {
    console.error('Proposal Analytics Error:', error)

    return NextResponse.json(
      { error: 'Erro ao obter analytics' },
      { status: 500 }
    )
  }
}
