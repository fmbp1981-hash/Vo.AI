import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * GET /api/settings/integrations
 * Load integration settings for the current tenant
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user with tenant
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { tenant: true }
        })

        if (!user?.tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Parse settings from tenant (stored as JSON)
        let settings = {}
        if (user.tenant.settings) {
            try {
                const allSettings = typeof user.tenant.settings === 'string'
                    ? JSON.parse(user.tenant.settings)
                    : user.tenant.settings
                settings = allSettings.integrations || {}
            } catch (e) {
                console.error('Error parsing tenant settings:', e)
            }
        }

        return NextResponse.json({
            success: true,
            settings
        })
    } catch (error: any) {
        console.error('Error loading integration settings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to load settings' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/settings/integrations
 * Save integration settings for the current tenant
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const newSettings = await request.json()

        // Get user with tenant
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { tenant: true }
        })

        if (!user?.tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
        }

        // Check if user has admin role
        if (user.role !== 'admin' && user.role !== 'superadmin') {
            return NextResponse.json(
                { error: 'Only admins can change integration settings' },
                { status: 403 }
            )
        }

        // Get existing settings and merge
        let existingSettings: any = {}
        if (user.tenant.settings) {
            try {
                existingSettings = typeof user.tenant.settings === 'string'
                    ? JSON.parse(user.tenant.settings)
                    : user.tenant.settings
            } catch (e) {
                existingSettings = {}
            }
        }

        // Merge new integration settings
        const updatedSettings = {
            ...existingSettings,
            integrations: newSettings
        }

        // Update tenant settings
        await db.tenant.update({
            where: { id: user.tenant.id },
            data: {
                settings: JSON.stringify(updatedSettings)
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Settings saved successfully'
        })
    } catch (error: any) {
        console.error('Error saving integration settings:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to save settings' },
            { status: 500 }
        )
    }
}
