import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { email, subject, message, cc } = body

    // Check if proposal exists
    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true
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

    if (proposal.status !== 'draft') {
      return NextResponse.json(
        { error: 'Apenas propostas em rascunho podem ser enviadas' },
        { status: 400 }
      )
    }

    // Update proposal status and sent timestamp
    const updatedProposal = await db.proposal.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        lead: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    })

    // In a real implementation, you would:
    // 1. Generate the PDF
    // 2. Send the email using a service like SendGrid, Mailgun, or Resend
    // 3. Store the PDF URL
    // 4. Track email opens and clicks

    // For now, we'll simulate the email sending
    const emailData = {
      to: email || proposal.lead.email,
      cc: cc || [],
      subject: subject || `Proposta: ${proposal.title}`,
      message: message || `Prezado(a) ${proposal.lead.nome},\n\nAnexamos a proposta comercial conforme solicitado.\n\nAtenciosamente,\nAGIR Viagens`,
      proposalId: id,
      proposalTitle: proposal.title,
      leadName: proposal.lead.nome
    }

    // Simulate email sending
    console.log('Sending email:', emailData)

    // Log activity
    await db.activity.create({
      data: {
        userId: proposal.userId,
        type: 'send_proposal',
        description: `Proposta "${proposal.title}" enviada para ${proposal.lead.nome}`,
        metadata: JSON.stringify({
          proposalId: id,
          leadId: proposal.leadId,
          leadName: proposal.lead.nome,
          email: email || proposal.lead.email
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        proposal: updatedProposal,
        email: emailData,
        message: 'Proposta enviada com sucesso'
      }
    })

  } catch (error: any) {
    console.error('Error sending proposal:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao enviar proposta',
        details: error.message 
      },
      { status: 500 }
    )
  }
}