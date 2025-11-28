import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateMFASecret } from '@/lib/mfa'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await generateMFASecret(session.user.id, session.user.email)

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('Error generating MFA secret:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
