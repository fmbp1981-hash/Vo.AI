import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp'

/**
 * Get QR Code for WhatsApp connection
 * GET /api/whatsapp/qrcode
 */
export async function GET(request: NextRequest) {
    try {
        const whatsapp = getWhatsAppProvider()

        if (!whatsapp.isConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'WhatsApp provider not configured. Please check your environment variables.',
                },
                { status: 500 }
            )
        }

        const qrData = await whatsapp.getQRCode()

        return NextResponse.json({
            success: true,
            data: qrData,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[QRCode] Error getting QR code:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get QR code',
            },
            { status: 500 }
        )
    }
}
