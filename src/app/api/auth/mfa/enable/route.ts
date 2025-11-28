import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyAndEnableMFA } from '@/lib/mfa'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { code } = await request.json()

        if (!code) {
            return NextResponse.json(
                { success: false, error: 'Code is required' },
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
            message: 'MFA enabled successfully'
        })
    } catch (error: any) {
        console.error('Error enabling MFA:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
