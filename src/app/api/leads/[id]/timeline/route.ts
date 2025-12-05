import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const leadId = params.id

        // Fetch timeline events
        // This aggregates different types of interactions
        const events = []

        // 1. Messages
        const messages = await db.message.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        })

        messages.forEach(msg => {
            events.push({
                id: `msg_${msg.id}`,
                type: 'message',
                title: 'Nova mensagem',
                description: msg.body?.substring(0, 100) || 'Mensagem enviada',
                timestamp: msg.createdAt.toISOString(),
                color: 'bg-blue-100 text-blue-600',
            })
        })

        // 2. Status changes
        const statusChanges = await db.leadHistory.findMany({
            where: {
                leadId,
                type: 'STATUS_CHANGE'
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }).catch(() => [])

        statusChanges.forEach(change => {
            events.push({
                id: `status_${change.id}`,
                type: 'status_change',
                title: 'Mudança de status',
                description: `Status alterado para ${change.newValue}`,
                timestamp: change.createdAt.toISOString(),
                color: 'bg-purple-100 text-purple-600',
            })
        })

        // 3. Proposals
        const proposals = await db.proposal.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        }).catch(() => [])

        proposals.forEach(proposal => {
            events.push({
                id: `proposal_${proposal.id}`,
                type: 'proposal',
                title: 'Proposta enviada',
                description: proposal.title || 'Proposta de viagem',
                timestamp: proposal.createdAt.toISOString(),
                color: 'bg-green-100 text-green-600',
            })
        })

        // 4. Notes
        const notes = await db.note.findMany({
            where: { leadId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        }).catch(() => [])

        notes.forEach(note => {
            events.push({
                id: `note_${note.id}`,
                type: 'note',
                title: 'Nota adicionada',
                description: note.content?.substring(0, 100) || 'Nota do consultor',
                timestamp: note.createdAt.toISOString(),
                color: 'bg-yellow-100 text-yellow-600',
            })
        })

        // Sort all events by timestamp (most recent first)
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        return NextResponse.json({
            success: true,
            events: events.slice(0, 50), // Limit to 50 most recent events
        })
    } catch (error) {
        console.error('Error fetching lead timeline:', error)
        return NextResponse.json(
            { error: 'Failed to fetch timeline' },
            { status: 500 }
        )
    }
}
