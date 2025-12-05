import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disableMFA } from '@/lib/mfa'

/**
 * POST /api/auth/mfa/disable
 * Disable MFA for the current user
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { password } = body

        // TODO: Verify user's password before disabling MFA
        // This is a security measure to ensure it's really the user
        // For now, we'll just disable it directly

        const success = await disableMFA(session.user.id)

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to disable MFA' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'MFA disabled successfully',
        })
    } catch (error: any) {
        console.error('Error disabling MFA:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to disable MFA' },
            { status: 500 }
        )
    }
}
