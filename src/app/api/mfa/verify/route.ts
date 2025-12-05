import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MFAService } from '@/lib/mfa'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const body = await request.json()
        const { secret, token } = body

        if (!secret || !token) {
            return NextResponse.json(
                { error: 'Secret e token são obrigatórios' },
                { status: 400 }
            )
        }

        const mfaService = new MFAService()
        const isValid = mfaService.verifyToken(secret, token)

        if (!isValid) {
            return NextResponse.json(
                { verified: false, error: 'Código inválido' },
                { status: 400 }
            )
        }

        // Generate backup codes
        const backupCodes = mfaService.generateBackupCodes(8)

        // Enable MFA in database
        await db.user.update({
            where: { email: session.user.email },
            data: {
                mfaEnabled: true,
                mfaSecret: secret,
                mfaBackupCodes: JSON.stringify(backupCodes),
            },
        })

        return NextResponse.json({
            verified: true,
            backupCodes,
        })
    } catch (error) {
        console.error('Error verifying MFA:', error)
        return NextResponse.json(
            { error: 'Erro ao verificar código' },
            { status: 500 }
        )
    }
}
