// Multi-Factor Authentication Library
// TOTP (Time-based One-Time Password) implementation

import * as OTPAuth from 'otpauth'
import { db } from '@/lib/db'
import QRCode from 'qrcode'

export type MFASetupResult = {
  secret: string
  qrCodeUrl: string
  backupCodes: string[]
}

export type MFAVerifyResult = {
  valid: boolean
  error?: string
}

const APP_NAME = 'Vo.AI - AGIR Viagens'

/**
 * Generate MFA secret and QR code for user
 */
export async function generateMFASecret(
  userId: string,
  userEmail: string
): Promise<MFASetupResult> {
  try {
    // Generate secret
    const totp = new OTPAuth.TOTP({
      issuer: APP_NAME,
      label: userEmail,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })

    const secret = totp.secret.base32

    // Generate QR code URL
    const otpauthUrl = totp.toString()
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl)

    // Generate backup codes (10 codes)
    const backupCodes = Array.from({ length: 10 }, () =>
      generateBackupCode()
    )

    // Save to database
    await db.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        mfaEnabled: false, // Not enabled until verified
        mfaBackupCodes: backupCodes.join(','),
      },
    })

    console.log('✅ MFA secret generated for user:', userId)

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    }
  } catch (error) {
    console.error('❌ Error generating MFA secret:', error)
    throw new Error('Failed to generate MFA secret')
  }
}

/**
 * Verify TOTP code and enable MFA
 */
export async function verifyAndEnableMFA(
  userId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaEnabled: true },
    })

    if (!user || !user.mfaSecret) {
      return {
        valid: false,
        error: 'MFA not configured',
      }
    }

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })

    // Validate code
    const delta = totp.validate({ token: code, window: 1 })

    if (delta === null) {
      console.log('⚠️ Invalid MFA code for user:', userId)
      return {
        valid: false,
        error: 'Invalid code',
      }
    }

    // Enable MFA if not already enabled
    if (!user.mfaEnabled) {
      await db.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      })
      console.log('✅ MFA enabled for user:', userId)
    }

    return {
      valid: true,
    }
  } catch (error) {
    console.error('❌ Error verifying MFA code:', error)
    return {
      valid: false,
      error: 'Verification failed',
    }
  }
}

/**
 * Verify MFA code for login
 */
export async function verifyMFACode(
  userId: string,
  code: string
): Promise<MFAVerifyResult> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        mfaSecret: true,
        mfaEnabled: true,
        mfaBackupCodes: true,
      },
    })

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return {
        valid: false,
        error: 'MFA not enabled',
      }
    }

    // Check if it's a backup code
    if (code.length === 8 && /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
      return verifyBackupCode(userId, code, user.mfaBackupCodes || '')
    }

    // Verify TOTP code
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.mfaSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })

    const delta = totp.validate({ token: code, window: 1 })

    if (delta === null) {
      console.log('⚠️ Invalid MFA code attempt for user:', userId)
      return {
        valid: false,
        error: 'Invalid code',
      }
    }

    console.log('✅ MFA code verified for user:', userId)
    return {
      valid: true,
    }
  } catch (error) {
    console.error('❌ Error verifying MFA code:', error)
    return {
      valid: false,
      error: 'Verification failed',
    }
  }
}

/**
 * Verify backup code
 */
async function verifyBackupCode(
  userId: string,
  code: string,
  backupCodes: string
): Promise<MFAVerifyResult> {
  const codes = backupCodes.split(',')
  const codeIndex = codes.indexOf(code)

  if (codeIndex === -1) {
    return {
      valid: false,
      error: 'Invalid backup code',
    }
  }

  // Remove used backup code
  codes.splice(codeIndex, 1)

  await db.user.update({
    where: { id: userId },
    data: {
      mfaBackupCodes: codes.join(','),
    },
  })

  console.log('✅ Backup code used for user:', userId, `(${codes.length} remaining)`)

  return {
    valid: true,
  }
}

/**
 * Disable MFA for user
 */
export async function disableMFA(userId: string): Promise<boolean> {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null,
      },
    })

    console.log('✅ MFA disabled for user:', userId)
    return true
  } catch (error) {
    console.error('❌ Error disabling MFA:', error)
    return false
  }
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string
): Promise<string[]> {
  try {
    const backupCodes = Array.from({ length: 10 }, () =>
      generateBackupCode()
    )

    await db.user.update({
      where: { id: userId },
      data: {
        mfaBackupCodes: backupCodes.join(','),
      },
    })

    console.log('✅ Backup codes regenerated for user:', userId)
    return backupCodes
  } catch (error) {
    console.error('❌ Error regenerating backup codes:', error)
    throw new Error('Failed to regenerate backup codes')
  }
}

/**
 * Generate a backup code (format: XXXX-XXXX)
 */
function generateBackupCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Remove confusing chars
  const part1 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  const part2 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  return `${part1}-${part2}`
}

/**
 * Check if user has MFA enabled
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true },
    })

    return user?.mfaEnabled || false
  } catch (error) {
    console.error('❌ Error checking MFA status:', error)
    return false
  }
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { mfaBackupCodes: true },
    })

    if (!user?.mfaBackupCodes) {
      return 0
    }

    return user.mfaBackupCodes.split(',').filter(Boolean).length
  } catch (error) {
    console.error('❌ Error getting backup codes count:', error)
    return 0
  }
}
