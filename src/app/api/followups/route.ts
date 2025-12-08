import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getWhatsAppProvider } from '@/lib/whatsapp'

// API to schedule and send automated follow-up messages
// Types: no_response, inactivity, trip_reminder, feedback

interface FollowUpSchedule {
    type: string
    delayHours: number
    message: string
}

// Follow-up templates based on lead stage and timing
const FOLLOWUP_TEMPLATES = {
    // No response follow-ups
    no_response_2h: {
        type: 'no_response_2h',
        delayHours: 2,
        message: 'Olá {nome}! 👋 Notei que você ainda não respondeu. Posso te ajudar com algo sobre sua viagem?'
    },
    no_response_4h: {
        type: 'no_response_4h',
        delayHours: 4,
        message: 'Oi {nome}! Ainda estou aqui se precisar de ajuda para planejar sua viagem dos sonhos! ✈️'
    },
    no_response_1d: {
        type: 'no_response_1d',
        delayHours: 24,
        message: 'Olá {nome}! Passando para lembrar que estamos à disposição para te ajudar com sua próxima viagem! 🌍'
    },
    no_response_2d: {
        type: 'no_response_2d',
        delayHours: 48,
        message: 'Oi {nome}! Ainda pensando na viagem? Posso te ajudar a encontrar as melhores opções! 😊'
    },

    // Inactivity follow-ups
    inactivity_30d: {
        type: 'inactivity_30d',
        delayHours: 720, // 30 days
        message: 'Olá {nome}! Faz um tempinho que não nos falamos. Já pensou em sua próxima viagem? Temos ótimas ofertas! ✈️'
    },
    inactivity_45d: {
        type: 'inactivity_45d',
        delayHours: 1080, // 45 days
        message: 'Oi {nome}! A AGIR está com condições especiais! Que tal planejar aquela viagem que você sempre quis? 🌴'
    },

    // Trip reminders
    reminder_7d: {
        type: 'reminder_7d',
        delayHours: -168, // 7 days before
        message: 'Olá {nome}! 🎉 Faltam apenas 7 dias para sua viagem para {destino}! Já preparou tudo? Qualquer dúvida estamos aqui!'
    },
    reminder_1d: {
        type: 'reminder_1d',
        delayHours: -24, // 1 day before
        message: 'Oi {nome}! 🛫 Amanhã é o grande dia! Sua viagem para {destino} está quase começando. Boa viagem!'
    },
    reminder_day: {
        type: 'reminder_day',
        delayHours: 0, // On the day
        message: 'Bom dia {nome}! 🌟 Hoje começa sua aventura em {destino}! Desejamos uma viagem incrível! #VamoViajar'
    },

    // Post-trip feedback
    feedback_2d: {
        type: 'feedback_2d',
        delayHours: 48, // 2 days after return
        message: 'Olá {nome}! 😊 Como foi sua viagem para {destino}? Adoraríamos ouvir sobre sua experiência! Nos conte como foi!'
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { action, leadId, type, customMessage, scheduledFor } = body

        switch (action) {
            case 'schedule':
                return scheduleFollowUp(leadId, type, customMessage, scheduledFor)

            case 'send_now':
                return sendFollowUpNow(leadId, type, customMessage)

            case 'cancel':
                return cancelFollowUp(leadId, type)

            case 'list_pending':
                return listPendingFollowUps(leadId)

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }
    } catch (error: any) {
        console.error('Follow-up API Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

async function scheduleFollowUp(
    leadId: string,
    type: string,
    customMessage?: string,
    scheduledFor?: string
) {
    const lead = await db.lead.findUnique({
        where: { id: leadId }
    })

    if (!lead) {
        return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
        )
    }

    const template = FOLLOWUP_TEMPLATES[type as keyof typeof FOLLOWUP_TEMPLATES]
    if (!template && !customMessage) {
        return NextResponse.json(
            { error: 'Invalid follow-up type or missing custom message' },
            { status: 400 }
        )
    }

    // Calculate scheduled time
    let scheduleDate: Date
    if (scheduledFor) {
        scheduleDate = new Date(scheduledFor)
    } else if (template) {
        scheduleDate = new Date()
        scheduleDate.setHours(scheduleDate.getHours() + template.delayHours)
    } else {
        scheduleDate = new Date()
    }

    // Personalize message
    let message = customMessage || template?.message || ''
    message = message
        .replace('{nome}', lead.nome.split(' ')[0])
        .replace('{destino}', lead.destino || 'seu destino')

    const followUp = await db.followUp.create({
        data: {
            leadId,
            type: type,
            message,
            channel: 'whatsapp',
            status: 'pending',
            scheduledFor: scheduleDate,
        }
    })

    return NextResponse.json({
        success: true,
        data: followUp,
        message: `Follow-up agendado para ${scheduleDate.toLocaleString('pt-BR')}`
    })
}

async function sendFollowUpNow(leadId: string, type: string, customMessage?: string) {
    const lead = await db.lead.findUnique({
        where: { id: leadId }
    })

    if (!lead || !lead.telefoneNormalizado) {
        return NextResponse.json(
            { error: 'Lead not found or no phone number' },
            { status: 404 }
        )
    }

    const template = FOLLOWUP_TEMPLATES[type as keyof typeof FOLLOWUP_TEMPLATES]
    let message = customMessage || template?.message || ''
    message = message
        .replace('{nome}', lead.nome.split(' ')[0])
        .replace('{destino}', lead.destino || 'seu destino')

    // Try to send via WhatsApp
    const whatsapp = getWhatsAppProvider()
    let sent = false
    let error = null

    if (whatsapp.isConfigured()) {
        try {
            await whatsapp.sendMessage(lead.telefoneNormalizado, message)
            sent = true
        } catch (e: any) {
            error = e.message
        }
    } else {
        error = 'WhatsApp (Evolution API) não configurado'
    }

    // Log the follow-up
    const followUp = await db.followUp.create({
        data: {
            leadId,
            type,
            message,
            channel: 'whatsapp',
            status: sent ? 'sent' : 'failed',
            scheduledFor: new Date(),
            sentAt: sent ? new Date() : null,
            errorMessage: error,
        }
    })

    // Update lead follow-up flags
    const flagUpdate: any = {}
    if (type === 'no_response_2h') flagUpdate.followUp2hEnviado = true
    if (type === 'no_response_4h') flagUpdate.followUp4hEnviado = true
    if (type === 'no_response_1d') flagUpdate.followUp1dEnviado = true
    if (type === 'no_response_2d') flagUpdate.followUp2dEnviado = true
    if (type === 'inactivity_30d') flagUpdate.followUp30dEnviado = true
    if (type === 'inactivity_45d') flagUpdate.followUp45dEnviado = true
    if (type === 'reminder_7d') flagUpdate.lembrete7dEnviado = true
    if (type === 'reminder_1d') flagUpdate.lembrete1dEnviado = true
    if (type === 'reminder_day') flagUpdate.lembreteDiaEnviado = true
    if (type === 'feedback_2d') flagUpdate.feedbackEnviado = true

    if (Object.keys(flagUpdate).length > 0) {
        await db.lead.update({
            where: { id: leadId },
            data: flagUpdate
        })
    }

    return NextResponse.json({
        success: sent,
        data: followUp,
        error,
        message: sent ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagem'
    })
}

async function cancelFollowUp(leadId: string, type: string) {
    const result = await db.followUp.updateMany({
        where: {
            leadId,
            type,
            status: 'pending'
        },
        data: {
            status: 'cancelled',
            updatedAt: new Date()
        }
    })

    return NextResponse.json({
        success: true,
        cancelled: result.count,
        message: `${result.count} follow-up(s) cancelado(s)`
    })
}

async function listPendingFollowUps(leadId?: string) {
    const where: any = { status: 'pending' }
    if (leadId) where.leadId = leadId

    const followUps = await db.followUp.findMany({
        where,
        orderBy: { scheduledFor: 'asc' },
        include: {
            lead: {
                select: {
                    nome: true,
                    telefoneNormalizado: true,
                    destino: true,
                }
            }
        }
    })

    return NextResponse.json({
        success: true,
        count: followUps.length,
        data: followUps
    })
}

// GET endpoint for available templates
export async function GET() {
    return NextResponse.json({
        templates: Object.keys(FOLLOWUP_TEMPLATES),
        details: FOLLOWUP_TEMPLATES
    })
}
