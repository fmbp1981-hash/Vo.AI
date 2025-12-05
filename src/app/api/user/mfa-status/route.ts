import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        // Get user MFA status
        const user = await db.user.findUnique({
            where: { email: session.user.email },
            select: {
                mfaEnabled: true,
            },
        })

        return NextResponse.json({
            mfaEnabled: user?.mfaEnabled || false,
        })
    } catch (error) {
        console.error('Error getting MFA status:', error)
        return NextResponse.json(
            { error: 'Erro ao verificar status do MFA' },
            { status: 500 }
        )
    }
}
