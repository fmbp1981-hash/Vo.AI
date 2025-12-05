import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        // Disable MFA in database
        await db.user.update({
            where: { email: session.user.email },
            data: {
                mfaEnabled: false,
                mfaSecret: null,
                mfaBackupCodes: null,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'MFA desativado com sucesso',
        })
    } catch (error) {
        console.error('Error disabling MFA:', error)
        return NextResponse.json(
            { error: 'Erro ao desativar MFA' },
            { status: 500 }
        )
    }
}
