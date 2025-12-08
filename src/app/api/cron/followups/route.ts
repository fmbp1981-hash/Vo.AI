import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getWhatsAppProvider } from '@/lib/whatsapp'

// CRON endpoint for processing scheduled follow-ups
// Should be called every 15 minutes via Vercel CRON or external scheduler
// Configure in vercel.json or call externally with CRON_SECRET header

const CRON_SECRET = process.env.CRON_SECRET || 'voai_cron_secret'

export async function GET(request: NextRequest) {
    // Verify CRON secret (for external calls)
    const authHeader = request.headers.get('authorization')
    const cronHeader = request.headers.get('x-cron-secret')

    // Allow Vercel CRON (has special header) or valid secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
    const isValidSecret = cronHeader === CRON_SECRET || authHeader === `Bearer ${CRON_SECRET}`

    if (!isVercelCron && !isValidSecret) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        const now = new Date()
        const results = {
            processed: 0,
            sent: 0,
            failed: 0,
            errors: [] as string[]
        }

        // Get pending follow-ups that are due
        const pendingFollowUps = await db.followUp.findMany({
            where: {
                status: 'pending',
                scheduledFor: {
                    lte: now
                }
            },
            include: {
                lead: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        telefoneNormalizado: true,
                        destino: true,
                        canal: true,
                    }
                }
            },
            take: 50, // Process max 50 per run
            orderBy: {
                scheduledFor: 'asc'
            }
        })

        if (pendingFollowUps.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending follow-ups',
                timestamp: now.toISOString()
            })
        }

        const whatsapp = getWhatsAppProvider()
        const isWhatsAppConfigured = whatsapp.isConfigured()

        for (const followUp of pendingFollowUps) {
            results.processed++

            const phone = followUp.lead?.telefoneNormalizado || followUp.lead?.telefone

            if (!phone) {
                await db.followUp.update({
                    where: { id: followUp.id },
                    data: {
                        status: 'failed',
                        errorMessage: 'Lead sem telefone',
                        updatedAt: now
                    }
                })
                results.failed++
                continue
            }

            // Personalize message
            let message = followUp.message
            if (followUp.lead) {
                message = message
                    .replace('{nome}', followUp.lead.nome?.split(' ')[0] || 'Cliente')
                    .replace('{destino}', followUp.lead.destino || 'seu destino')
            }

            // Try to send via WhatsApp
            if (isWhatsAppConfigured) {
                try {
                    await whatsapp.sendMessage(phone, message)

                    await db.followUp.update({
                        where: { id: followUp.id },
                        data: {
                            status: 'sent',
                            sentAt: now,
                            updatedAt: now
                        }
                    })

                    // Update lead follow-up flags
                    await updateLeadFollowUpFlag(followUp.lead!.id, followUp.type)

                    results.sent++
                } catch (error: any) {
                    await db.followUp.update({
                        where: { id: followUp.id },
                        data: {
                            status: 'failed',
                            errorMessage: error.message,
                            updatedAt: now
                        }
                    })
                    results.failed++
                    results.errors.push(`${followUp.id}: ${error.message}`)
                }
            } else {
                // WhatsApp not configured - mark as failed with note
                await db.followUp.update({
                    where: { id: followUp.id },
                    data: {
                        status: 'failed',
                        errorMessage: 'WhatsApp não configurado',
                        updatedAt: now
                    }
                })
                results.failed++
            }
        }

        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            whatsappConfigured: isWhatsAppConfigured,
            results
        })

    } catch (error: any) {
        console.error('CRON follow-up error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// Update lead flag based on follow-up type
async function updateLeadFollowUpFlag(leadId: string, type: string) {
    const flagMap: Record<string, string> = {
        'no_response_2h': 'followUp2hEnviado',
        'no_response_4h': 'followUp4hEnviado',
        'no_response_1d': 'followUp1dEnviado',
        'no_response_2d': 'followUp2dEnviado',
        'inactivity_30d': 'followUp30dEnviado',
        'inactivity_45d': 'followUp45dEnviado',
        'reminder_7d': 'lembrete7dEnviado',
        'reminder_1d': 'lembrete1dEnviado',
        'reminder_day': 'lembreteDiaEnviado',
        'feedback_2d': 'feedbackEnviado',
    }

    const flagField = flagMap[type]
    if (flagField) {
        await db.lead.update({
            where: { id: leadId },
            data: { [flagField]: true }
        })
    }
}

// POST: Manually trigger specific follow-up types for leads
export async function POST(request: NextRequest) {
    const cronHeader = request.headers.get('x-cron-secret')
    if (cronHeader !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { action } = body

        switch (action) {
            case 'schedule_trip_reminders':
                return scheduleTripReminders()

            case 'schedule_inactivity':
                return scheduleInactivityFollowUps()

            case 'schedule_no_response':
                return scheduleNoResponseFollowUps()

            case 'schedule_birthdays':
                return scheduleBirthdayMessages()

            case 'schedule_feedback':
                return schedulePostTripFeedback()

            case 'run_all':
                // Run all schedulers at once
                const tripResults = await scheduleTripRemindersInternal()
                const inactivityResults = await scheduleInactivityInternal()
                const birthdayResults = await scheduleBirthdaysInternal()
                const feedbackResults = await scheduleFeedbackInternal()
                return NextResponse.json({
                    success: true,
                    tripReminders: tripResults,
                    inactivity: inactivityResults,
                    birthdays: birthdayResults,
                    feedback: feedbackResults,
                })

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Schedule trip reminders for upcoming departures
async function scheduleTripReminders() {
    const results = await scheduleTripRemindersInternal()
    return NextResponse.json({ success: true, ...results })
}

async function scheduleTripRemindersInternal() {
    const now = new Date()
    const results = { scheduled: 0, types: [] as string[] }

    const upcomingTrips = await db.lead.findMany({
        where: {
            dataPartida: { not: null },
            estagio: { in: ['Fechado', 'Fechado Ganho', 'Negociação'] },
            telefoneNormalizado: { not: null },
        },
        select: {
            id: true, nome: true, telefoneNormalizado: true, destino: true,
            dataPartida: true, dataRetorno: true,
            lembrete7dEnviado: true, lembrete1dEnviado: true, lembreteDiaEnviado: true,
            feedbackEnviado: true,
        }
    })

    for (const lead of upcomingTrips) {
        if (!lead.dataPartida) continue

        const daysUntilTrip = Math.ceil(
            (lead.dataPartida.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // 7 days reminder
        if (daysUntilTrip === 7 && !lead.lembrete7dEnviado) {
            await createFollowUp(lead.id, 'reminder_7d', lead.nome, lead.destino)
            results.scheduled++
            results.types.push('7d')
        }

        // 1 day reminder
        if (daysUntilTrip === 1 && !lead.lembrete1dEnviado) {
            await createFollowUp(lead.id, 'reminder_1d', lead.nome, lead.destino)
            results.scheduled++
            results.types.push('1d')
        }

        // Day of trip
        if (daysUntilTrip === 0 && !lead.lembreteDiaEnviado) {
            await createFollowUp(lead.id, 'reminder_day', lead.nome, lead.destino)
            results.scheduled++
            results.types.push('day')
        }
    }

    return results
}

// Schedule inactivity follow-ups
async function scheduleInactivityFollowUps() {
    const results = await scheduleInactivityInternal()
    return NextResponse.json({ success: true, ...results })
}

async function scheduleInactivityInternal() {
    const now = new Date()
    const results = { scheduled: 0 }
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const inactiveLeads = await db.lead.findMany({
        where: {
            estagio: { in: ['Novo Lead', 'Qualificação', 'Gerar Proposta', 'Cancelado', 'Não Qualificado'] },
            updatedAt: { lte: thirtyDaysAgo },
            telefoneNormalizado: { not: null },
        },
        select: {
            id: true, nome: true, destino: true, updatedAt: true,
            followUp30dEnviado: true, followUp45dEnviado: true,
        }
    })

    for (const lead of inactiveLeads) {
        const daysSinceUpdate = Math.ceil(
            (now.getTime() - lead.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysSinceUpdate >= 45 && !lead.followUp45dEnviado) {
            await createFollowUp(lead.id, 'inactivity_45d', lead.nome, lead.destino)
            results.scheduled++
        } else if (daysSinceUpdate >= 30 && !lead.followUp30dEnviado) {
            await createFollowUp(lead.id, 'inactivity_30d', lead.nome, lead.destino)
            results.scheduled++
        }
    }

    return results
}

// Schedule no-response follow-ups
async function scheduleNoResponseFollowUps() {
    return NextResponse.json({
        success: true,
        message: 'No-response follow-ups are scheduled by the agent workflow based on conversation tracking'
    })
}

// Schedule birthday messages
async function scheduleBirthdayMessages() {
    const results = await scheduleBirthdaysInternal()
    return NextResponse.json({ success: true, ...results })
}

async function scheduleBirthdaysInternal() {
    const now = new Date()
    const results = { scheduled: 0, leads: [] as string[] }

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    // Find all leads with birthdays - we need to check month/day
    const allLeads = await db.lead.findMany({
        where: {
            dataNascimento: { not: null },
            telefoneNormalizado: { not: null },
        },
        select: {
            id: true, nome: true, dataNascimento: true, destino: true,
        }
    })

    for (const lead of allLeads) {
        if (!lead.dataNascimento) continue

        const birthMonth = lead.dataNascimento.getMonth() + 1
        const birthDay = lead.dataNascimento.getDate()

        // Check if today is their birthday
        if (birthMonth === todayMonth && birthDay === todayDay) {
            // Check if we already sent birthday message today
            const existingBirthday = await db.followUp.findFirst({
                where: {
                    leadId: lead.id,
                    type: 'birthday',
                    createdAt: { gte: today },
                }
            })

            if (!existingBirthday) {
                await createFollowUp(lead.id, 'birthday', lead.nome, lead.destino)
                results.scheduled++
                results.leads.push(lead.nome)
            }
        }
    }

    return results
}

// Schedule post-trip feedback (2 days after return)
async function schedulePostTripFeedback() {
    const results = await scheduleFeedbackInternal()
    return NextResponse.json({ success: true, ...results })
}

async function scheduleFeedbackInternal() {
    const now = new Date()
    const results = { scheduled: 0 }

    // Find leads who returned 2 days ago
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    const returnedLeads = await db.lead.findMany({
        where: {
            dataRetorno: { gte: threeDaysAgo, lte: twoDaysAgo },
            estagio: { in: ['Fechado', 'Fechado Ganho'] },
            telefoneNormalizado: { not: null },
            feedbackEnviado: false,
        },
        select: {
            id: true, nome: true, destino: true,
        }
    })

    for (const lead of returnedLeads) {
        await createFollowUp(lead.id, 'feedback_2d', lead.nome, lead.destino)
        results.scheduled++
    }

    return results
}

// Helper to create follow-up record
async function createFollowUp(
    leadId: string,
    type: string,
    nome: string | null,
    destino: string | null
) {
    const firstName = nome?.split(' ')[0] || 'Cliente'
    const dest = destino || 'seu destino'

    const templates: Record<string, string> = {
        'reminder_7d': `Olá ${firstName}! 🌍✈️ Faltam apenas 7 dias para a sua viagem para ${dest}!

Que tal revisar tudo para garantir uma experiência tranquila?

🧾 *Checklist de viagem:*
✅ Documentos (RG/CNH ou Passaporte)
✅ Passagens e reservas
✅ Cartões habilitados
✅ Medicamentos (se usar)

Conte sempre com a equipe da *AGIR Viagens* para o que precisar. 💙`,
        'reminder_1d': `Oi ${firstName}! 😍 Amanhã é o grande dia da sua viagem para ${dest}!

🧳 *Checklist final:*
✅ Documentos ok?
✅ Passagem e reservas?
✅ Cartões e dinheiro?
✅ Malas prontas?
✅ Itinerário no celular?

A *AGIR Viagens* está sempre com você. 💙`,
        'reminder_day': `Bom dia, ${firstName}! 🌞 Hoje é o dia da sua viagem para ${dest}!

Desejamos uma viagem incrível e cheia de boas lembranças! 💙
A *AGIR Viagens* está sempre à disposição. 😉`,
        'inactivity_30d': `Olá ${firstName}! Faz um tempinho que não nos falamos. Já pensou em sua próxima viagem? Temos ótimas ofertas! ✈️`,
        'inactivity_45d': `Oi ${firstName}! A AGIR está com condições especiais! Que tal planejar aquela viagem que você sempre quis? 🌴`,
        'feedback_2d': `Oi ${firstName}! 😍 Que bom tê-lo(a) de volta! Como foi sua viagem para ${dest}? Adoraríamos ouvir sobre sua experiência e saber se a AGIR Viagens contribuiu para tornar tudo especial. Seu feedback faz toda diferença pra gente! 💬💙`,
        'birthday': `🎉 Parabéns, ${firstName}! 🎉

A equipe da AGIR Viagens deseja a você um Feliz Aniversário, repleto de alegria, novas descobertas e, claro, muitas viagens incríveis!

Que seu novo ciclo seja tão especial quanto você. 💙✈️

Conte sempre conosco para transformar seus sonhos em realidade.`,
    }

    await db.followUp.create({
        data: {
            leadId,
            type,
            message: templates[type] || `Follow-up: ${type}`,
            channel: 'whatsapp',
            status: 'pending',
            scheduledFor: new Date(),
        }
    })
}

