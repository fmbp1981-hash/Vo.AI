import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import axios from 'axios'
import OpenAI from 'openai'

/**
 * POST /api/settings/integrations/check
 * Test connection to integration providers
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { provider, settings } = await request.json()

        switch (provider) {
            case 'evolutionApi':
                return await testEvolutionApi(settings.evolutionApi)
            case 'zApi':
                return await testZApi(settings.zApi)
            case 'waba':
                return await testWaba(settings.waba)
            case 'openai':
                return await testOpenAI(settings.openai)
            default:
                return NextResponse.json({
                    connected: false,
                    error: 'Provider inválido'
                })
        }
    } catch (error: any) {
        console.error('Error testing connection:', error)
        return NextResponse.json({
            connected: false,
            error: error.message || 'Erro ao testar conexão'
        })
    }
}

async function testEvolutionApi(config: { url: string; apiKey: string; instanceName: string }) {
    if (!config.url || !config.apiKey) {
        return NextResponse.json({ connected: false, error: 'URL e API Key são obrigatórios' })
    }

    try {
        const response = await axios.get(
            `${config.url}/instance/connectionState/${config.instanceName || 'default'}`,
            {
                headers: { 'apikey': config.apiKey },
                timeout: 10000
            }
        )

        const connected = response.data?.state === 'open' || response.status === 200
        return NextResponse.json({
            connected,
            status: response.data?.state,
            message: connected ? 'Conectado com sucesso' : 'Instância não conectada'
        })
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            error: error.response?.data?.message || error.message || 'Falha na conexão'
        })
    }
}

async function testZApi(config: { instanceId: string; token: string; clientToken: string }) {
    if (!config.instanceId || !config.token) {
        return NextResponse.json({ connected: false, error: 'Instance ID e Token são obrigatórios' })
    }

    try {
        const response = await axios.get(
            `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}/status`,
            {
                headers: config.clientToken ? { 'Client-Token': config.clientToken } : {},
                timeout: 10000
            }
        )

        const connected = response.data?.connected === true
        return NextResponse.json({
            connected,
            status: response.data?.status,
            message: connected ? 'Conectado com sucesso' : 'Instância desconectada'
        })
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            error: error.response?.data?.message || error.message || 'Falha na conexão'
        })
    }
}

async function testWaba(config: { phoneNumberId: string; accessToken: string; businessAccountId: string }) {
    if (!config.phoneNumberId || !config.accessToken) {
        return NextResponse.json({ connected: false, error: 'Phone Number ID e Access Token são obrigatórios' })
    }

    try {
        const response = await axios.get(
            `https://graph.facebook.com/v18.0/${config.phoneNumberId}`,
            {
                headers: { 'Authorization': `Bearer ${config.accessToken}` },
                timeout: 10000
            }
        )

        return NextResponse.json({
            connected: true,
            phoneNumber: response.data?.display_phone_number,
            message: 'Conectado com sucesso'
        })
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            error: error.response?.data?.error?.message || error.message || 'Token inválido ou expirado'
        })
    }
}

async function testOpenAI(config: { apiKey: string; model: string }) {
    if (!config.apiKey) {
        return NextResponse.json({ connected: false, error: 'API Key é obrigatória' })
    }

    try {
        const openai = new OpenAI({ apiKey: config.apiKey })

        // Simple test: list models
        const models = await openai.models.list()
        const hasModel = models.data.some(m => m.id.includes('gpt'))

        return NextResponse.json({
            connected: hasModel,
            message: hasModel ? 'API Key válida' : 'Sem acesso aos modelos GPT'
        })
    } catch (error: any) {
        return NextResponse.json({
            connected: false,
            error: error.message?.includes('401') ? 'API Key inválida' : (error.message || 'Falha na conexão')
        })
    }
}
