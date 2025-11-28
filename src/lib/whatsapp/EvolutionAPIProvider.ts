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
 * Implementação do provider para Evolution API
 * Documentação: https://doc.evolution-api.com/
 */
export class EvolutionAPIProvider implements IWhatsAppProvider {
    readonly providerName = 'evolution-api'
    private client: AxiosInstance
    private instanceName: string

    constructor(config?: WhatsAppProviderConfig) {
        const baseURL = config?.apiUrl || process.env.EVOLUTION_API_URL
        const apiKey = config?.apiKey || process.env.EVOLUTION_API_KEY
        this.instanceName = config?.instanceName || process.env.EVOLUTION_INSTANCE_NAME || 'voai-agir'

        this.client = axios.create({
            baseURL,
            headers: {
                'apikey': apiKey || '',
                'Content-Type': 'application/json',
            },
            timeout: config?.timeout || 30000,
        })
    }

    isConfigured(): boolean {
        return !!(
            this.client.defaults.baseURL &&
            this.client.defaults.headers['apikey']
        )
    }

    async getQRCode(): Promise<{ qrcode: string; status: string }> {
        try {
            const response = await this.client.get(`/instance/qrcode/${this.instanceName}`)
            return response.data
        } catch (error: any) {
            console.error('[EvolutionAPI] Error getting QR code:', error.response?.data || error.message)
            throw new Error('Erro ao obter QR Code do WhatsApp')
        }
    }

    async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
        try {
            const response = await this.client.get(`/instance/connectionState/${this.instanceName}`)
            return response.data
        } catch (error: any) {
            console.error('[EvolutionAPI] Error getting connection status:', error.response?.data || error.message)
            return {
                state: 'close',
                status: 'disconnected',
            }
        }
    }

    async sendTextMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post(`/message/sendText/${this.instanceName}`, {
                number: params.number,
                textMessage: {
                    text: params.message,
                },
            })
            return {
                messageId: response.data.key?.id || response.data.messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[EvolutionAPI] Error sending message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mensagem pelo WhatsApp')
        }
    }

    async sendMediaMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post(`/message/sendMedia/${this.instanceName}`, {
                number: params.number,
                mediaMessage: {
                    mediaUrl: params.mediaUrl,
                    caption: params.caption,
                    mediatype: params.mediaType,
                },
            })
            return {
                messageId: response.data.key?.id || response.data.messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[EvolutionAPI] Error sending media:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mídia pelo WhatsApp')
        }
    }

    async sendButtonMessage(params: WhatsAppButtonMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post(`/message/sendButtons/${this.instanceName}`, {
                number: params.number,
                buttonMessage: {
                    title: params.title,
                    text: params.message,
                    footer: params.footer || 'Vo.AI - AGIR Viagens',
                    buttons: params.buttons.map((btn) => ({
                        buttonId: btn.id,
                        buttonText: { displayText: btn.displayText },
                        type: 1,
                    })),
                },
            })
            return {
                messageId: response.data.key?.id || response.data.messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[EvolutionAPI] Error sending button message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar mensagem com botões')
        }
    }

    async sendListMessage(params: WhatsAppListMessage): Promise<WhatsAppMessageResponse> {
        try {
            const response = await this.client.post(`/message/sendList/${this.instanceName}`, {
                number: params.number,
                listMessage: {
                    title: params.title,
                    text: params.message,
                    buttonText: params.buttonText,
                    footerText: 'Vo.AI - AGIR Viagens',
                    sections: params.sections,
                },
            })
            return {
                messageId: response.data.key?.id || response.data.messageId,
                status: 'sent',
                timestamp: new Date().toISOString(),
            }
        } catch (error: any) {
            console.error('[EvolutionAPI] Error sending list message:', error.response?.data || error.message)
            throw new Error('Erro ao enviar menu pelo WhatsApp')
        }
    }

    async getProfilePicture(number: string): Promise<{ profilePictureUrl?: string }> {
        try {
            const response = await this.client.get(`/chat/getProfilePictureUrl/${this.instanceName}`, {
                params: { number },
            })
            return response.data
        } catch (error: any) {
            console.error('[EvolutionAPI] Error getting profile picture:', error.response?.data || error.message)
            return {}
        }
    }

    async markAsRead(params: { messageId: string; remoteJid: string }): Promise<void> {
        try {
            await this.client.post(`/chat/markMessageAsRead/${this.instanceName}`, {
                key: {
                    id: params.messageId,
                    remoteJid: params.remoteJid,
                },
            })
        } catch (error: any) {
            console.error('[EvolutionAPI] Error marking as read:', error.response?.data || error.message)
        }
    }

    async getChatHistory(number: string, limit: number = 50): Promise<any[]> {
        try {
            const response = await this.client.get(`/chat/fetchMessages/${this.instanceName}`, {
                params: {
                    number,
                    limit,
                },
            })
            return response.data.messages || []
        } catch (error: any) {
            console.error('[EvolutionAPI] Error fetching chat history:', error.response?.data || error.message)
            return []
        }
    }

    async logout(): Promise<void> {
        try {
            await this.client.delete(`/instance/logout/${this.instanceName}`)
        } catch (error: any) {
            console.error('[EvolutionAPI] Error logging out:', error.response?.data || error.message)
            throw new Error('Erro ao desconectar WhatsApp')
        }
    }
}
