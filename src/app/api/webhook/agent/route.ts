import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { headers } from 'next/headers'

// Webhook API for external agents (GPT Maker, n8n) to register/update leads
// This acts like an MCP endpoint for the Sofia agent

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'voai_webhook_secret'

// Verify webhook signature
function verifyWebhook(request: NextRequest): boolean {
    const authHeader = request.headers.get('x-webhook-secret')
    return authHeader === WEBHOOK_SECRET
}

export async function POST(request: NextRequest) {
    try {
        // Verify webhook auth
        if (!verifyWebhook(request)) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { action, data } = body

        // Get default tenant (or use tenant from request if multi-tenant)
        let tenant = await db.tenant.findFirst({
            where: { slug: data.tenantSlug || 'default' }
        })

        if (!tenant) {
            tenant = await db.tenant.create({
                data: {
                    name: 'Default',
                    slug: 'default',
                    isActive: true,
                }
            })
        }

        switch (action) {
            case 'search_lead':
                return handleSearchLead(data, tenant.id)

            case 'create_lead':
                return handleCreateLead(data, tenant.id)

            case 'update_lead':
                return handleUpdateLead(data)

            case 'update_stage':
                return handleUpdateStage(data)

            case 'request_handover':
                return handleRequestHandover(data)

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}` },
                    { status: 400 }
                )
        }

    } catch (error: any) {
        console.error('Webhook API Error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        )
    }
}

// Search lead by phone (Telefone_Normalizado)
async function handleSearchLead(data: any, tenantId: string) {
    const { telefoneNormalizado, telefone } = data

    const lead = await db.lead.findFirst({
        where: {
            tenantId,
            OR: [
                { telefoneNormalizado: telefoneNormalizado },
                { telefone: telefone },
            ]
        }
    })

    return NextResponse.json({
        success: true,
        found: !!lead,
        data: lead
    })
}

// Create new lead
async function handleCreateLead(data: any, tenantId: string) {
    const {
        nome,
        telefone,
        telefoneNormalizado,
        email,
        dataNascimento,
        canal,
        destino,
        periodo,
        dataPartida,
        dataRetorno,
        orcamento,
        pessoas,
        estagio = 'Novo Lead',
        observacoes,
        recorrente = false,
    } = data

    const lead = await db.lead.create({
        data: {
            tenantId,
            nome,
            telefone,
            telefoneNormalizado,
            email,
            dataNascimento,
            canal,
            destino,
            periodo,
            dataPartida: dataPartida ? new Date(dataPartida) : null,
            dataRetorno: dataRetorno ? new Date(dataRetorno) : null,
            orcamento,
            pessoas,
            estagio,
            status: estagio,
            observacoes,
            recorrente,
        }
    })

    return NextResponse.json({
        success: true,
        data: lead,
        message: 'Lead criado com sucesso'
    })
}

// Update existing lead
async function handleUpdateLead(data: any) {
    const { leadId, ...updateData } = data

    if (!leadId) {
        return NextResponse.json(
            { error: 'leadId is required' },
            { status: 400 }
        )
    }

    // Handle date conversions
    if (updateData.dataPartida) {
        updateData.dataPartida = new Date(updateData.dataPartida)
    }
    if (updateData.dataRetorno) {
        updateData.dataRetorno = new Date(updateData.dataRetorno)
    }

    const lead = await db.lead.update({
        where: { id: leadId },
        data: {
            ...updateData,
            updatedAt: new Date(),
        }
    })

    return NextResponse.json({
        success: true,
        data: lead,
        message: 'Lead atualizado com sucesso'
    })
}

// Update lead stage (pipeline)
async function handleUpdateStage(data: any) {
    const { leadId, telefoneNormalizado, estagio, motivoCancelamento } = data

    let lead
    if (leadId) {
        lead = await db.lead.findUnique({ where: { id: leadId } })
    } else if (telefoneNormalizado) {
        lead = await db.lead.findFirst({ where: { telefoneNormalizado } })
    }

    if (!lead) {
        return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
        )
    }

    const updateData: any = {
        estagio,
        status: estagio,
        updatedAt: new Date(),
    }

    // Set qualificado flag
    if (estagio === 'Qualificação' || estagio === 'Proposta' || estagio === 'Negociação') {
        updateData.qualificado = true
    }

    // Handle cancellation
    if (estagio === 'Cancelado' || estagio === 'Fechado Perdido' || estagio === 'Não Qualificado') {
        updateData.motivoCancelamento = motivoCancelamento
        updateData.dataFechamento = new Date()
    }

    // Handle successful close
    if (estagio === 'Fechado' || estagio === 'Fechado Ganho') {
        updateData.dataFechamento = new Date()
    }

    const updatedLead = await db.lead.update({
        where: { id: lead.id },
        data: updateData
    })

    return NextResponse.json({
        success: true,
        data: updatedLead,
        message: `Estágio atualizado para: ${estagio}`
    })
}

// Request handover to human consultant
async function handleRequestHandover(data: any) {
    const {
        leadId,
        telefoneNormalizado,
        reason,
        resumoAtendimento,
        consultorTelefone
    } = data

    let lead
    if (leadId) {
        lead = await db.lead.findUnique({ where: { id: leadId } })
    } else if (telefoneNormalizado) {
        lead = await db.lead.findFirst({ where: { telefoneNormalizado } })
    }

    if (!lead) {
        return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
        )
    }

    // Update lead to waiting handover
    await db.lead.update({
        where: { id: lead.id },
        data: {
            status: 'waiting_handover',
            observacoes: resumoAtendimento
                ? `${lead.observacoes || ''}\n\n[HANDOVER] ${reason}\n${resumoAtendimento}`
                : lead.observacoes,
            updatedAt: new Date(),
        }
    })

    // Create conversation if doesn't exist
    const conversation = await db.conversation.upsert({
        where: { id: lead.id }, // Fallback, will create new
        create: {
            leadId: lead.id,
            tenantId: lead.tenantId,
            channel: lead.canal || 'whatsapp',
            messages: JSON.stringify([]),
            status: 'waiting_handoff',
            handoffMode: 'human',
            handoffReason: reason,
            handoffRequestedAt: new Date(),
        },
        update: {
            status: 'waiting_handoff',
            handoffMode: 'human',
            handoffReason: reason,
            handoffRequestedAt: new Date(),
        }
    })

    // TODO: Send WhatsApp notification to consultant
    // This will be implemented when Evolution API is configured
    const notificationSent = false
    let notificationMessage = 'Notificação não enviada (Evolution API não configurada)'

    if (consultorTelefone && process.env.EVOLUTION_API_URL) {
        // Will send notification here
        notificationMessage = `Consultor será notificado em: ${consultorTelefone}`
    }

    return NextResponse.json({
        success: true,
        data: {
            lead,
            conversationId: conversation.id,
            handoverStatus: 'waiting',
        },
        notification: notificationMessage,
        message: 'Handover solicitado com sucesso'
    })
}

// GET endpoint for health check and webhook info
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        version: '1.0',
        endpoints: {
            search_lead: 'Busca lead por telefone normalizado',
            create_lead: 'Cria novo lead',
            update_lead: 'Atualiza dados do lead',
            update_stage: 'Atualiza estágio no pipeline',
            request_handover: 'Solicita transferência para consultor',
        },
        stages: [
            'Novo Lead',
            'Qualificação',
            'Proposta',
            'Negociação',
            'Fechado',
            'Cancelado',
            'Não Qualificado',
        ]
    })
}
