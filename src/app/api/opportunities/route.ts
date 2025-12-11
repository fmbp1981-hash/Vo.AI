import { NextRequest, NextResponse } from 'next/server'
import { OpportunitiesService } from '@/lib/opportunities-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/opportunities
 * Retorna todas as oportunidades ativas
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'birthdays', 'milestones', 'all'

        // TODO: Get tenantId from session
        const tenantId = undefined

        if (type === 'summary') {
            const summary = await OpportunitiesService.getOpportunitiesSummary(tenantId)
            return NextResponse.json(summary)
        }

        const opportunities = await OpportunitiesService.getOpportunities(tenantId)

        if (type === 'birthdays') {
            return NextResponse.json({ opportunities: opportunities.birthdays })
        }

        if (type === 'milestones') {
            return NextResponse.json({ opportunities: opportunities.milestones })
        }

        return NextResponse.json({
            birthdays: opportunities.birthdays,
            milestones: opportunities.milestones,
            total: opportunities.birthdays.length + opportunities.milestones.length,
        })
    } catch (error) {
        console.error('[API Opportunities] Error:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar oportunidades' },
            { status: 500 }
        )
    }
}
