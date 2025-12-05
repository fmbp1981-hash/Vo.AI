import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
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

        // Fetch messages from database
        // This is a placeholder - adjust based on your actual schema
        const messages = await db.message.findMany({
            where: {
                OR: [
                    { leadId: leadId },
                    { conversationId: leadId }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            },
            take: 100, // Limit to last 100 messages
        })

        return NextResponse.json({
            success: true,
            messages: messages.map(msg => ({
                id: msg.id,
                from: msg.from,
                to: msg.to,
                body: msg.body,
                timestamp: msg.createdAt.toISOString(),
                type: msg.type || 'text',
                status: msg.status || 'delivered',
                isFromMe: msg.isFromConsultant || false,
            })),
        })
    } catch (error) {
        console.error('Error fetching WhatsApp messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}
