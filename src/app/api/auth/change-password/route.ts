import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true },
    })

    if (!user?.password) {
      return NextResponse.json({ error: 'Senha não configurada' }, { status: 400 })
    }

    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await db.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('change-password error:', error)
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 })
  }
}
