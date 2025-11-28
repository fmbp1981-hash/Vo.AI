import axios, { AxiosInstance } from 'axios'
import {
    IWhatsAppProvider,
    WhatsAppMessage,
    WhatsAppButtonMessage,
    WhatsAppListMessage,
    WhatsAppConnectionStatus,
    WhatsAppMessageResponse,
    WhatsAppProviderConfig,
} from './IWhatsAppProvider'

/**
 * Implementação do provider para Z-API
 * Documentação: https://developer.z-api.io/
 */
export class ZAPIProvider implements IWhatsAppProvider {
    readonly providerName = 'z-api'
    private client: AxiosInstance
    private instanceId: string
    private token: string

    constructor(config?: WhatsAppProviderConfig) {
        const baseURL = config?.apiUrl || process.env.ZAPI_URL
        this.instanceId = config?.instanceName || process.env.ZAPI_INSTANCE_ID || ''
        this.token = config?.apiKey || process.env.ZAPI_TOKEN || ''

        this.client = axios.create({
            baseURL: baseURL || `https://api.z-api.io/instances/${this.instanceId}`,
            headers: {
                'Client-Token': this.token,
                'Content-Type': 'application/json',
            },
            timeout: config?.timeout || 30000,
        })
    }

    isConfigured(): boolean {
        return !!(this.instanceId && this.token)
    }

    async getQRCode(): Promise<{ qrcode: string; status: string }> {
        try {
            const response = await this.client.get('/token/qr-code/image')
            return {
                qrcode: response.data.value || response.data.qrcode,
                status: response.data.connected ? 'connected' : 'disconnected',
            }
        } catch (error: any) {
            console.error('[Z-API] Error getting QR code:', error.response?.data || error.message)
            throw new Error('Erro ao obter QR Code do WhatsApp')
        }
    }

    async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
        try {
            const response = await this.client.get('/status')
            const connected = response.data.connected || response.data.state === 'open'

            return {
                state: connected ? 'open' : 'close',
                status: connected ? 'connected' : 'disconnected',
            }
        } catch (error: any) {
            console.error('[Z-API] Error getting connection status:', error.response?.data || error.message)
            return {
                state: 'close',
                status: 'disconnected',
            }
        }
    }

    async sendTextMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post('/send-text', {
                phone: params.number,
                message: params.message,
            })
            return {
                messageId: response.data.messageId || response.data.zaapId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[Z-API] Error sending message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mensagem pelo WhatsApp')
        }
    }

    async sendMediaMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse> {
        try {
            const endpoint = {
                image: '/send-image',
                document: '/send-document',
                audio: '/send-audio',
                video: '/send-video',
            }[params.mediaType || 'image']

            const response = await this.client.post(endpoint, {
                phone: params.number,
                [params.mediaType || 'image']: params.mediaUrl,
                caption: params.caption,
            })

            return {
                messageId: response.data.messageId || response.data.zaapId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[Z-API] Error sending media:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mídia pelo WhatsApp')
        }
    }

    async sendButtonMessage(params: WhatsAppButtonMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post('/send-button-list', {
                phone: params.number,
                message: params.message,
                buttonText: params.title,
                buttons: params.buttons.map((btn) => ({
                    id: btn.id,
                    label: btn.displayText,
                })),
            })

            return {
                messageId: response.data.messageId || response.data.zaapId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[Z-API] Error sending button message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mensagem com botões')
        }
    }

    async sendListMessage(params: WhatsAppListMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post('/send-option-list', {
                phone: params.number,
                message: params.message,
                title: params.title,
                buttonLabel: params.buttonText,
                options: params.sections.flatMap((section) =>
                    section.rows.map((row) => ({
                        id: row.id,
                        title: row.title,
                        description: row.description,
                    }))
                ),
            })

            return {
                messageId: response.data.messageId || response.data.zaapId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[Z-API] Error sending list message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar menu pelo WhatsApp')
        }
    }

    async getProfilePicture(number: string): Promise<{ profilePictureUrl?: string }> {
        try {
            const response = await this.client.get('/profile-picture', {
                params: { phone: number },
            })
            return {
                profilePictureUrl: response.data.profilePictureUrl || response.data.value,
            }
        } catch (error: any) {
            console.error('[Z-API] Error getting profile picture:', error.response?.data || error.message)
            return {}
        }
    }

    async markAsRead(params: { messageId: string; remoteJid: string }): Promise<void> {
        try {
            // Z-API usa phone ao invés de messageId para marcar como lido
            await this.client.post('/read-message', {
                phone: params.remoteJid,
                messageId: params.messageId,
            })
        } catch (error: any) {
            console.error('[Z-API] Error marking as read:', error.response?.data || error.message)
        }
    }

    async getChatHistory(number: string, limit: number = 50): Promise<any[]> {
        try {
            const response = await this.client.get('/messages', {
                params: {
                    phone: number,
                    limit,
                },
            })
            return response.data || []
        } catch (error: any) {
            console.error('[Z-API] Error fetching chat history:', error.response?.data || error.message)
            return []
        }
    }

    async logout(): Promise<void> {
        try {
            await this.client.post('/logout')
        } catch (error: any) {
            console.error('[Z-API] Error logging out:', error.response?.data || error.message)
            throw new Error('Erro ao desconectar WhatsApp')
        }
    }
}
