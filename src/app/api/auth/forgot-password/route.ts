import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const user = await db.user.findFirst({
      where: {
        email: normalizedEmail,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
      },
    })

    // Always return success to avoid user enumeration
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(token)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const passwordResetToken = (db as any).passwordResetToken

    // Invalidate previous tokens for this user (best-effort)
    await passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    })

    await passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000'
    const resetUrl = `${appUrl.replace(/\/$/, '')}/auth/reset-password/${token}`

    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('forgot-password error:', error)
    // Avoid leaking details
    return NextResponse.json({ success: true })
  }
}
