import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateLeadScore } from '@/lib/lead-scoring'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/leads/[id]/score
 * Calculate and update lead score
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch lead
        const lead = await db.lead.findUnique({
            where: { id: params.id },
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        // Calculate score
        const scoreBreakdown = calculateLeadScore({
            orcamento: lead.orcamento || undefined,
            dataUltimaMensagem: lead.dataUltimaMensagem || undefined,
            qualificado: lead.qualificado,
            recorrente: lead.recorrente,
            canal: lead.canal || undefined,
            dataPartida: lead.dataPartida || undefined,
            created: lead.created,
        })

        // Update lead with new score
        const updatedLead = await db.lead.update({
            where: { id: params.id },
            data: {
                score: scoreBreakdown.total,
            },
        })

        return NextResponse.json({
            success: true,
            score: scoreBreakdown.total,
            breakdown: scoreBreakdown,
            lead: updatedLead,
        })
    } catch (error) {
        console.error('[Lead Score API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to calculate score' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/leads/[id]/score
 * Get current lead score with breakdown
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const lead = await db.lead.findUnique({
            where: { id: params.id },
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        const scoreBreakdown = calculateLeadScore({
            orcamento: lead.orcamento || undefined,
            dataUltimaMensagem: lead.dataUltimaMensagem || undefined,
            qualificado: lead.qualificado,
            recorrente: lead.recorrente,
            canal: lead.canal || undefined,
            dataPartida: lead.dataPartida || undefined,
            created: lead.created,
        })

        return NextResponse.json({
            currentScore: lead.score,
            calculatedScore: scoreBreakdown.total,
            breakdown: scoreBreakdown,
            needsUpdate: lead.score !== scoreBreakdown.total,
        })
    } catch (error) {
        console.error('[Lead Score API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to get score' },
            { status: 500 }
        )
    }
}
