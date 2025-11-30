import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/roteiros/[id]
 * Get single itinerary by ID
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

        const itinerary = await db.itinerary.findUnique({
            where: {
                id: params.id,
            },
        })

        if (!itinerary) {
            return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
        }

        return NextResponse.json(itinerary)
    } catch (error) {
        console.error('[Itinerary API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch itinerary' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/roteiros/[id]
 * Update itinerary
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { content, totalCost } = body

        const itinerary = await db.itinerary.update({
            where: {
                id: params.id,
            },
            data: {
                content,
                totalCost,
                updatedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            itinerary,
        })
    } catch (error) {
        console.error('[Itinerary API] Error updating:', error)
        return NextResponse.json(
            { error: 'Failed to update itinerary' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/roteiros/[id]
 * Delete itinerary
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await db.itinerary.delete({
            where: {
                id: params.id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Itinerary API] Error deleting:', error)
        return NextResponse.json(
            { error: 'Failed to delete itinerary' },
            { status: 500 }
        )
    }
}
