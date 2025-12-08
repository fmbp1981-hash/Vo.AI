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
                return scheduleTrioReminders()

            case 'schedule_inactivity':
                return scheduleInactivityFollowUps()

            case 'schedule_no_response':
                return scheduleNoResponseFollowUps()

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Schedule trip reminders for upcoming departures
async function scheduleTrioReminders() {
    const now = new Date()
    const results = { scheduled: 0 }

    // Find leads with upcoming trips (7 days, 1 day, today)
    const upcomingTrips = await db.lead.findMany({
        where: {
            dataPartida: { not: null },
            estagio: { in: ['Fechado', 'Fechado Ganho', 'Negociação'] },
        },
        select: {
            id: true,
            nome: true,
            telefoneNormalizado: true,
            destino: true,
            dataPartida: true,
            lembrete7dEnviado: true,
            lembrete1dEnviado: true,
            lembreteDiaEnviado: true,
        }
    })

    for (const lead of upcomingTrips) {
        if (!lead.dataPartida || !lead.telefoneNormalizado) continue

        const daysUntilTrip = Math.ceil(
            (lead.dataPartida.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )

        // 7 days reminder
        if (daysUntilTrip === 7 && !lead.lembrete7dEnviado) {
            await createFollowUp(lead.id, 'reminder_7d', lead.nome, lead.destino)
            results.scheduled++
        }

        // 1 day reminder
        if (daysUntilTrip === 1 && !lead.lembrete1dEnviado) {
            await createFollowUp(lead.id, 'reminder_1d', lead.nome, lead.destino)
            results.scheduled++
        }

        // Day of trip
        if (daysUntilTrip === 0 && !lead.lembreteDiaEnviado) {
            await createFollowUp(lead.id, 'reminder_day', lead.nome, lead.destino)
            results.scheduled++
        }
    }

    return NextResponse.json({ success: true, ...results })
}

// Schedule inactivity follow-ups
async function scheduleInactivityFollowUps() {
    const now = new Date()
    const results = { scheduled: 0 }

    // Find inactive leads (30+ days since last contact)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const fortyFiveDaysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

    const inactiveLeads = await db.lead.findMany({
        where: {
            estagio: { in: ['Novo Lead', 'Qualificação'] },
            updatedAt: { lte: thirtyDaysAgo },
            telefoneNormalizado: { not: null },
        },
        select: {
            id: true,
            nome: true,
            destino: true,
            updatedAt: true,
            followUp30dEnviado: true,
            followUp45dEnviado: true,
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

    return NextResponse.json({ success: true, ...results })
}

// Schedule no-response follow-ups (for recent leads)
async function scheduleNoResponseFollowUps() {
    // This would be triggered based on last message time
    // For now, return empty - to be implemented based on conversation tracking
    return NextResponse.json({
        success: true,
        message: 'No-response follow-ups should be scheduled by the agent workflow'
    })
}

// Helper to create follow-up record
async function createFollowUp(
    leadId: string,
    type: string,
    nome: string | null,
    destino: string | null
) {
    const templates: Record<string, string> = {
        'reminder_7d': `Olá ${nome?.split(' ')[0] || 'Cliente'}! 🎉 Faltam apenas 7 dias para sua viagem para ${destino || 'seu destino'}! Já preparou tudo?`,
        'reminder_1d': `Oi ${nome?.split(' ')[0] || 'Cliente'}! 🛫 Amanhã é o grande dia! Sua viagem para ${destino || 'seu destino'} está quase começando. Boa viagem!`,
        'reminder_day': `Bom dia ${nome?.split(' ')[0] || 'Cliente'}! 🌟 Hoje começa sua aventura em ${destino || 'seu destino'}! Desejamos uma viagem incrível!`,
        'inactivity_30d': `Olá ${nome?.split(' ')[0] || 'Cliente'}! Faz um tempinho que não nos falamos. Já pensou em sua próxima viagem? Temos ótimas ofertas! ✈️`,
        'inactivity_45d': `Oi ${nome?.split(' ')[0] || 'Cliente'}! A AGIR está com condições especiais! Que tal planejar aquela viagem que você sempre quis? 🌴`,
    }

    await db.followUp.create({
        data: {
            leadId,
            type,
            message: templates[type] || `Follow-up: ${type}`,
            channel: 'whatsapp',
            status: 'pending',
            scheduledFor: new Date(), // Send immediately on next CRON run
        }
    })
}
