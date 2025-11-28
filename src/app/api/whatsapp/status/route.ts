import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppProvider } from '@/lib/whatsapp'

/**
 * Check WhatsApp connection status
 * GET /api/whatsapp/status
 */
export async function GET(request: NextRequest) {
    try {
        const whatsapp = getWhatsAppProvider()

        if (!whatsapp.isConfigured()) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'WhatsApp provider not configured',
                    data: {
                        configured: false,
                        provider: whatsapp.providerName,
                    },
                },
                { status: 200 }
            )
        }

        const statusData = await whatsapp.getConnectionStatus()

        return NextResponse.json({
            success: true,
            data: {
                ...statusData,
                configured: true,
                provider: whatsapp.providerName,
            },
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Status] Error getting status:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to get status',
                data: {
                    state: 'unknown',
                    status: 'error',
                },
            },
            { status: 500 }
        )
    }
}
