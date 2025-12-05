import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyAndEnableMFA } from '@/lib/mfa'

/**
 * POST /api/auth/mfa/verify
 * Verify MFA code during setup or login
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { code } = body

        if (!code || code.length !== 6) {
            return NextResponse.json(
                { success: false, error: 'Invalid code format' },
                { status: 400 }
            )
        }

        const result = await verifyAndEnableMFA(session.user.id, code)

        if (!result.valid) {
            return NextResponse.json(
                { success: false, error: result.error || 'Invalid code' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'MFA enabled successfully',
        })
    } catch (error: any) {
        console.error('Error verifying MFA code:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Verification failed' },
            { status: 500 }
        )
    }
}
