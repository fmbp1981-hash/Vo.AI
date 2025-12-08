import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getWhatsAppProvider } from '@/lib/whatsapp'

// API to schedule and send automated follow-up messages
// Types: no_response, inactivity, trip_reminder, feedback, birthday, reactivation

interface FollowUpSchedule {
    type: string
    delayHours: number
    message: string
}

// Follow-up templates based on n8n workflow logic
const FOLLOWUP_TEMPLATES = {
    // === NO RESPONSE SEQUENCE (Progressive) ===
    no_response_30min: {
        type: 'no_response_30min',
        delayHours: 0.5,
        message: 'Olá! Só passando para ver se ainda posso te ajudar com sua viagem. 😊'
    },
    no_response_2h: {
        type: 'no_response_2h',
        delayHours: 2,
        message: 'Oi {nome}! Alguma novidade sobre sua viagem? Estou aqui para ajudar! 😉'
    },
    no_response_4h: {
        type: 'no_response_4h',
        delayHours: 4,
        message: 'Pensando em você, {nome}! Encontrei algumas opções de custo-benefício para {destino}. Quer dar uma olhada? ✨'
    },
    no_response_1d: {
        type: 'no_response_1d',
        delayHours: 24,
        message: 'Olá {nome}! Ainda tem interesse em planejar sua viagem? Se precisar de algo, é só falar!'
    },
    no_response_2d: {
        type: 'no_response_2d',
        delayHours: 48,
        message: 'Preparei um mini-guia rápido sobre {destino}, {nome}. Espero que ajude! 🗺️'
    },
    no_response_3d: {
        type: 'no_response_3d',
        delayHours: 72,
        message: 'Olá {nome}! Como não tive retorno, vou encerrar nosso atendimento por enquanto. Se precisar de algo no futuro, é só me chamar! A AGIR Viagens está sempre à disposição. 👋'
    },

    // === INACTIVITY / REACTIVATION ===
    inactivity_30d: {
        type: 'inactivity_30d',
        delayHours: 720,
        message: 'Olá {nome}! Faz um tempinho que não nos falamos. Já pensou em sua próxima viagem? Temos ótimas ofertas! ✈️'
    },
    inactivity_45d: {
        type: 'inactivity_45d',
        delayHours: 1080,
        message: 'Oi {nome}! A AGIR está com condições especiais! Que tal planejar aquela viagem que você sempre quis? 🌴'
    },
    reactivation: {
        type: 'reactivation',
        delayHours: 0,
        message: 'Olá {nome}, notamos que faz um tempo desde nosso último contato. {historico}A AGIR Viagens tem novas propostas incríveis para você e gostaríamos de saber se ainda tem interesse em planejar sua próxima viagem!'
    },

    // === TRIP REMINDERS WITH CHECKLISTS ===
    reminder_7d: {
        type: 'reminder_7d',
        delayHours: -168,
        message: `Olá {nome}! 🌍✈️ Faltam apenas 7 dias para a sua viagem para {destino}!

Que tal revisar tudo para garantir uma experiência tranquila?

🧾 *Checklist de viagem:*
{checklist}

Conte sempre com a equipe da *AGIR Viagens* para o que precisar. 💙`
    },
    reminder_1d: {
        type: 'reminder_1d',
        delayHours: -24,
        message: `Oi {nome}! 😍 Amanhã é o grande dia da sua viagem para {destino}!

🧳 *Checklist final:*
✅ Documentos ok (RG, CNH ou Passaporte)?
✅ Passagem e comprovantes de reserva?
✅ Cartões e dinheiro separados?
✅ Malas prontas e etiquetadas?
✅ Itinerário e contatos salvos no celular?

Aproveite cada segundo dessa experiência! A *AGIR Viagens* está sempre com você. 💙`
    },
    reminder_day: {
        type: 'reminder_day',
        delayHours: 0,
        message: `Bom dia, {nome}! 🌞 Hoje é o dia da sua tão esperada viagem para {destino}!

Antes de sair de casa, confirme se está com tudo certinho:
✅ Documentos e passagens?
✅ Cartões e carteira?
✅ Celular carregado e carregadores?
✅ Malas separadas e etiquetadas?

Desejamos uma viagem incrível e cheia de boas lembranças! 💙
A *AGIR Viagens* está sempre à disposição. 😉`
    },

    // === POST-TRIP FEEDBACK ===
    feedback_2d: {
        type: 'feedback_2d',
        delayHours: 48,
        message: 'Oi {nome}! 😍 Que bom tê-lo(a) de volta! Como foi sua viagem para {destino}? Adoraríamos ouvir sobre sua experiência e saber se a AGIR Viagens contribuiu para tornar tudo especial. Seu feedback faz toda diferença pra gente! 💬💙'
    },

    // === BIRTHDAY ===
    birthday: {
        type: 'birthday',
        delayHours: 0,
        message: `🎉 Parabéns, {nome}! 🎉

A equipe da AGIR Viagens deseja a você um Feliz Aniversário, repleto de alegria, novas descobertas e, claro, muitas viagens incríveis!

Que seu novo ciclo seja tão especial quanto você. 💙✈️

Conte sempre conosco para transformar seus sonhos em realidade.`
    },

    // === CLOSED DEAL CONFIRMATION ===
    deal_closed: {
        type: 'deal_closed',
        delayHours: 0,
        message: `🎉 Parabéns, {nome}!

Sua decisão de viajar com a AGIR foi confirmada! Estamos muito felizes em fazer parte deste momento especial.

Detalhes do seu pacote:
• Destino: {destino}
• Partida: {dataPartida}
• Retorno: {dataRetorno}
{tipoViagem}

Em breve, você receberá um e-mail com todos os detalhes e dicas para sua viagem. Conte com a AGIR sempre que precisar!`
    }
}

// Checklists based on trip type
const CHECKLIST_NACIONAL = `✅ *Voos nacionais:* RG ou CNH original em bom estado
✅ Cartão de embarque e comprovante de reserva
✅ Passagem impressa ou no celular
✅ Cartões de crédito/débito
✅ Medicamentos e receitas médicas (se usar)`

const CHECKLIST_INTERNACIONAL = `✅ *Voos internacionais:* Passaporte válido (6+ meses)
✅ Visto (se necessário para o destino)
✅ Passagem de ida e volta
✅ Seguro-viagem obrigatório
✅ Comprovante de hospedagem
✅ Certificado de vacinação (se exigido)
✅ Cartões habilitados para uso internacional`


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
