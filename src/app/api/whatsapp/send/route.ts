import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp'
import { normalizePhoneNumber } from '@/lib/whatsapp/helpers'

/**
 * Send manual WhatsApp message
 * POST /api/whatsapp/send
 * 
 * Request body:
 * {
 *   "phone": "(11) 99999-9999" or "5511999999999",
 *   "message": "Your message here"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { phone, message } = body

        if (!phone || !message) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: phone and message',
                },
                { status: 400 }
            )
        }

        const whatsapp = getWhatsAppProvider()

        if (!whatsapp.isConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'WhatsApp provider not configured',
                },
                { status: 500 }
            )
        }

        // Normalize phone number
        const normalizedPhone = normalizePhoneNumber(phone)

        console.log(`[Send] Sending message to ${normalizedPhone}`)

        // Send message
        const result = await whatsapp.sendTextMessage({
            number: normalizedPhone,
            message,
        })

        return NextResponse.json({
            success: true,
            data: result,
            phone: normalizedPhone,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Send] Error sending message:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to send message',
            },
            { status: 500 }
        )
    }
}
