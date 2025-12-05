import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next/auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all active conversations
        // Group messages by lead/conversation
        const conversations = await db.message.groupBy({
            by: ['leadId'],
            _count: {
                id: true,
            },
            _max: {
                createdAt: true,
                body: true,
            },
            where: {
                // Only active conversations
                lead: {
                    status: {
                        notIn: ['Arquivado', 'Perdido']
                    }
                }
            },
            orderBy: {
                _max: {
                    createdAt: 'desc'
                }
            },
            take: 50,
        }).catch(() => [])

        // Enrich with lead data
        const enrichedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const lead = await db.lead.findUnique({
                    where: { id: conv.leadId },
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        canal: true,
                        status: true,
                    },
                })

                // Count unread messages
                const unreadCount = await db.message.count({
                    where: {
                        leadId: conv.leadId,
                        read: false,
                        isFromConsultant: false, // Messages from customer
                    },
                }).catch(() => 0)

                return {
                    id: conv.leadId,
                    leadId: conv.leadId,
                    leadName: lead?.nome || 'Lead sem nome',
                    lastMessage: conv._max.body || '',
                    lastMessageTime: conv._max.createdAt?.toISOString() || new Date().toISOString(),
                    unreadCount,
                    channel: (lead?.canal?.toLowerCase() || 'webchat') as 'whatsapp' | 'instagram' | 'webchat' | 'email',
                    status: unreadCount > 0 ? 'active' : 'waiting',
                }
            })
        )

        return NextResponse.json({
            success: true,
            conversations: enrichedConversations,
            total: enrichedConversations.length,
        })
    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}
