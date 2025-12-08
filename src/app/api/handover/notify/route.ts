import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getWhatsAppProvider } from '@/lib/whatsapp'

// API to notify consultants of handover requests
// Called when lead reaches "Gerar Proposta" stage or requests human

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            leadId,
            reason,
            resumoAtendimento,
            consultorId,
            consultorTelefone,
            urgencia = 'normal' // normal, alta, urgente
        } = body

        if (!leadId) {
            return NextResponse.json(
                { error: 'leadId is required' },
                { status: 400 }
            )
        }

        // Get lead data
        const lead = await db.lead.findUnique({
            where: { id: leadId },
            include: {
                tenant: true
            }
        })

        if (!lead) {
            return NextResponse.json(
                { error: 'Lead not found' },
                { status: 404 }
            )
        }

        // Get consultant to notify
        let consultant = null
        let phoneToNotify = consultorTelefone

        if (consultorId) {
            consultant = await db.user.findUnique({
                where: { id: consultorId }
            })
            if (consultant?.phoneNumber) {
                phoneToNotify = consultant.phoneNumber
            }
        }

        // If no specific consultant, find any available admin/consultant
        if (!phoneToNotify) {
            const availableConsultant = await db.user.findFirst({
                where: {
                    tenantId: lead.tenantId,
                    role: { in: ['admin', 'manager', 'consultant'] },
                    isActive: true,
                    notifyOnHandoff: true,
                    phoneNumber: { not: null }
                }
            })

            if (availableConsultant) {
                consultant = availableConsultant
                phoneToNotify = availableConsultant.phoneNumber
            }
        }

        // Update lead status
        await db.lead.update({
            where: { id: leadId },
            data: {
                status: 'waiting_handover',
                observacoes: resumoAtendimento
                    ? `${lead.observacoes || ''}\n\n[HANDOVER ${new Date().toLocaleString('pt-BR')}]\nMotivo: ${reason}\n${resumoAtendimento}`
                    : lead.observacoes,
                updatedAt: new Date(),
            }
        })

        // Create/update conversation
        await db.conversation.upsert({
            where: { id: `handover_${leadId}` },
            create: {
                id: `handover_${leadId}`,
                leadId: lead.id,
                tenantId: lead.tenantId,
                channel: lead.canal || 'whatsapp',
                messages: JSON.stringify([{
                    role: 'system',
                    content: `Handover solicitado: ${reason}`,
                    timestamp: new Date().toISOString()
                }]),
                status: 'waiting_handoff',
                handoffMode: 'human',
                handoffReason: reason,
                handoffRequestedAt: new Date(),
                userId: consultant?.id,
            },
            update: {
                status: 'waiting_handoff',
                handoffMode: 'human',
                handoffReason: reason,
                handoffRequestedAt: new Date(),
                userId: consultant?.id,
            }
        })

        // Create notification record
        if (consultant) {
            await db.notification.create({
                data: {
                    userId: consultant.id,
                    type: 'handover',
                    title: `🔔 Novo atendimento aguardando`,
                    message: `${lead.nome} precisa de atendimento humano. Motivo: ${reason}`,
                    link: `/inbox?leadId=${leadId}`,
                }
            })
        }

        // Build notification message
        const urgencyEmoji = urgencia === 'urgente' ? '🚨' : urgencia === 'alta' ? '⚠️' : '📞'
        const notificationMessage = `${urgencyEmoji} *NOVO ATENDIMENTO AGUARDANDO*

👤 *Cliente:* ${lead.nome}
📱 *Telefone:* ${lead.telefone || lead.telefoneNormalizado}
${lead.destino ? `✈️ *Destino:* ${lead.destino}` : ''}
${lead.orcamento ? `💰 *Orçamento:* ${lead.orcamento}` : ''}

📋 *Motivo:* ${reason}
${resumoAtendimento ? `\n📝 *Resumo:*\n${resumoAtendimento.substring(0, 300)}...` : ''}

🔗 Acesse o sistema para continuar o atendimento.`

        // Send WhatsApp notification
        let notificationSent = false
        let notificationError = null

        if (phoneToNotify) {
            const whatsapp = getWhatsAppProvider()

            if (whatsapp.isConfigured()) {
                try {
                    await whatsapp.sendMessage(phoneToNotify, notificationMessage)
                    notificationSent = true
                } catch (e: any) {
                    notificationError = e.message
                }
            } else {
                notificationError = 'WhatsApp (Evolution API) não configurado'
            }
        } else {
            notificationError = 'Nenhum consultor com telefone disponível para notificação'
        }

        return NextResponse.json({
            success: true,
            data: {
                leadId: lead.id,
                consultantId: consultant?.id,
                consultantName: consultant?.name,
                phoneNotified: phoneToNotify,
                notificationSent,
            },
            error: notificationError,
            message: notificationSent
                ? 'Consultor notificado com sucesso'
                : 'Handover registrado, mas notificação WhatsApp falhou'
        })

    } catch (error: any) {
        console.error('Handover notification error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// GET: List pending handovers
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tenantId = searchParams.get('tenantId')
        const status = searchParams.get('status') || 'waiting_handoff'

        const conversations = await db.conversation.findMany({
            where: {
                status,
                ...(tenantId ? { tenantId } : {})
            },
            orderBy: { handoffRequestedAt: 'desc' },
            include: {
                lead: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        telefoneNormalizado: true,
                        destino: true,
                        orcamento: true,
                        estagio: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            count: conversations.length,
            data: conversations
        })

    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}
