import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    const tokenHash = sha256Hex(token)

    const passwordResetToken = (db as any).passwordResetToken

    const record = await passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!record || record.usedAt) {
      return NextResponse.json({ error: 'Token inválido ou já utilizado' }, { status: 400 })
    }

    if (record.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { password: passwordHash },
      }),
      passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Erro ao redefinir senha' }, { status: 500 })
  }
}
