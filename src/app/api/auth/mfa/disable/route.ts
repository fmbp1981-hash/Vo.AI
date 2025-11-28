import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disableMFA } from '@/lib/mfa'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // In a real app, you might want to require a password or MFA code to disable MFA
        // For now, we'll just allow it for the authenticated user

        const success = await disableMFA(session.user.id)

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Failed to disable MFA' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'MFA disabled successfully'
        })
    } catch (error: any) {
        console.error('Error disabling MFA:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
