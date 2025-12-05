import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MFAService } from '@/lib/mfa'
import { db } from '@/lib/db'

export async function POST() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const mfaService = new MFAService()
        const secret = mfaService.generateSecret()
        const qrCodeUrl = mfaService.generateQRCode(session.user.email, secret)

        // Save secret to database (not enabled yet)
        await db.user.update({
            where: { email: session.user.email },
            data: {
                mfaSecret: secret,
                mfaEnabled: false,
            },
        })

        return NextResponse.json({
            success: true,
            secret,
            qrCodeUrl,
        })
    } catch (error) {
        console.error('Error setting up MFA:', error)
        return NextResponse.json(
            { error: 'Erro ao configurar MFA' },
            { status: 500 }
        )
    }
}
