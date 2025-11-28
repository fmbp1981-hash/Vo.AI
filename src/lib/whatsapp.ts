import axios, { AxiosInstance } from 'axios'

// Evolution API client configuration
export class EvolutionAPI {
  private client: AxiosInstance
  private instanceName: string

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    this.instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'voai-agir'

    if (!baseURL || !apiKey) {
      console.warn('Evolution API not configured. WhatsApp features will be disabled.')
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'apikey': apiKey || '',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Get QR Code for WhatsApp connection
   */
  async getQRCode(): Promise<{ qrcode: string; status: string }> {
    try {
      const response = await this.client.get(`/instance/qrcode/${this.instanceName}`)
      return response.data
    } catch (error: any) {
      console.error('Error getting QR code:', error.response?.data || error.message)
      throw new Error('Erro ao obter QR Code do WhatsApp')
    }
  }

  /**
   * Get instance connection status
   */
  async getConnectionStatus(): Promise<{
    state: 'open' | 'connecting' | 'close'
    status: 'connected' | 'disconnected' | 'connecting'
  }> {
    try {
      const response = await this.client.get(`/instance/connectionState/${this.instanceName}`)
      return response.data
    } catch (error: any) {
      console.error('Error getting connection status:', error.response?.data || error.message)
      return {
        state: 'close',
        status: 'disconnected'
      }
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(params: {
    number: string // Format: 5511999999999 (country code + number)
    message: string
  }): Promise<{ messageId: string; status: string }> {
    try {
      const response = await this.client.post(`/message/sendText/${this.instanceName}`, {
        number: params.number,
        textMessage: {
          text: params.message
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message)
      throw new Error('Erro ao enviar mensagem pelo WhatsApp')
    }
  }

  /**
   * Send media message (image, document, audio, video)
   */
  async sendMediaMessage(params: {
    number: string
    mediaUrl: string
    caption?: string
    mediaType: 'image' | 'document' | 'audio' | 'video'
  }): Promise<{ messageId: string; status: string }> {
    try {
      const endpoint = {
        image: 'sendMedia',
        document: 'sendMedia',
        audio: 'sendMedia',
        video: 'sendMedia',
      }[params.mediaType]

      const response = await this.client.post(`/message/${endpoint}/${this.instanceName}`, {
        number: params.number,
        mediaMessage: {
          mediaUrl: params.mediaUrl,
          caption: params.caption,
          mediatype: params.mediaType
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error sending media:', error.response?.data || error.message)
      throw new Error('Erro ao enviar mídia pelo WhatsApp')
    }
  }

  /**
   * Send message with buttons
   */
  async sendButtonMessage(params: {
    number: string
    title: string
    message: string
    footer?: string
    buttons: Array<{ id: string; displayText: string }>
  }): Promise<{ messageId: string; status: string }> {
    try {
      const response = await this.client.post(`/message/sendButtons/${this.instanceName}`, {
        number: params.number,
        buttonMessage: {
          title: params.title,
          text: params.message,
          footer: params.footer || 'Vo.AI - AGIR Viagens',
          buttons: params.buttons.map(btn => ({
            buttonId: btn.id,
            buttonText: { displayText: btn.displayText },
            type: 1
          }))
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error sending button message:', error.response?.data || error.message)
      throw new Error('Erro ao enviar mensagem com botões')
    }
  }

  /**
   * Send message with list/menu
   */
  async sendListMessage(params: {
    number: string
    title: string
    message: string
    buttonText: string
    sections: Array<{
      title: string
      rows: Array<{
        id: string
        title: string
        description?: string
      }>
    }>
  }): Promise<{ messageId: string; status: string }> {
    try {
      const response = await this.client.post(`/message/sendList/${this.instanceName}`, {
        number: params.number,
        listMessage: {
          title: params.title,
          text: params.message,
          buttonText: params.buttonText,
          footerText: 'Vo.AI - AGIR Viagens',
          sections: params.sections
        }
      })
      return response.data
    } catch (error: any) {
      console.error('Error sending list message:', error.response?.data || error.message)
      throw new Error('Erro ao enviar menu pelo WhatsApp')
    }
  }

  /**
   * Get profile picture URL
   */
  async getProfilePicture(number: string): Promise<{ profilePictureUrl?: string }> {
    try {
      const response = await this.client.get(`/chat/getProfilePictureUrl/${this.instanceName}`, {
        params: { number }
      })
      return response.data
    } catch (error: any) {
      console.error('Error getting profile picture:', error.response?.data || error.message)
      return {}
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(params: {
    messageId: string
    remoteJid: string // Contact JID
  }): Promise<void> {
    try {
      await this.client.post(`/chat/markMessageAsRead/${this.instanceName}`, {
        key: {
          id: params.messageId,
          remoteJid: params.remoteJid,
        }
      })
    } catch (error: any) {
      console.error('Error marking as read:', error.response?.data || error.message)
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(number: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await this.client.get(`/chat/fetchMessages/${this.instanceName}`, {
        params: {
          number,
          limit
        }
      })
      return response.data.messages || []
    } catch (error: any) {
      console.error('Error fetching chat history:', error.response?.data || error.message)
      return []
    }
  }

  /**
   * Logout and disconnect
   */
  async logout(): Promise<void> {
    try {
      await this.client.delete(`/instance/logout/${this.instanceName}`)
    } catch (error: any) {
      console.error('Error logging out:', error.response?.data || error.message)
      throw new Error('Erro ao desconectar WhatsApp')
    }
  }
}

// Singleton instance
export const evolutionAPI = new EvolutionAPI()

// Helper functions

/**
 * Normalize phone number to Evolution API format
 * Input: (11) 99999-9999, 11999999999, +5511999999999
 * Output: 5511999999999
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // If starts with country code, return as is
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits
  }
  
  // Add Brazil country code
  return `55${digits}`
}

/**
 * Format phone number for display
 * Input: 5511999999999
 * Output: +55 (11) 99999-9999
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.length === 13) { // 55 + DDD + 9 digits
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  
  if (digits.length === 12) { // 55 + DDD + 8 digits (landline)
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
  }
  
  return phone
}

/**
 * Create quick reply buttons for common responses
 */
export function createQuickReplyButtons(): Array<{ id: string; displayText: string }> {
  return [
    { id: 'more_info', displayText: '📋 Mais informações' },
    { id: 'call_consultant', displayText: '👤 Falar com consultor' },
    { id: 'get_quote', displayText: '💰 Solicitar orçamento' },
  ]
}

/**
 * Create destination menu
 */
export function createDestinationMenu(): {
  title: string
  message: string
  buttonText: string
  sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
} {
  return {
    title: '🌍 Escolha seu destino',
    message: 'Selecione uma região de interesse para começarmos o planejamento:',
    buttonText: 'Ver destinos',
    sections: [
      {
        title: 'Europa',
        rows: [
          { id: 'paris', title: 'Paris', description: 'Cidade luz, romance e cultura' },
          { id: 'london', title: 'Londres', description: 'História, arte e modernidade' },
          { id: 'rome', title: 'Roma', description: 'Império Romano e gastronomia' },
          { id: 'barcelona', title: 'Barcelona', description: 'Gaudí, praia e vida noturna' },
        ]
      },
      {
        title: 'Américas',
        rows: [
          { id: 'nyc', title: 'Nova York', description: 'A cidade que nunca dorme' },
          { id: 'miami', title: 'Miami', description: 'Praias e compras' },
          { id: 'cancun', title: 'Cancún', description: 'Caribe mexicano paradisíaco' },
          { id: 'buenosaires', title: 'Buenos Aires', description: 'Tango, vinho e charme' },
        ]
      },
      {
        title: 'Ásia & Oceania',
        rows: [
          { id: 'tokyo', title: 'Tóquio', description: 'Tradição e tecnologia' },
          { id: 'dubai', title: 'Dubai', description: 'Luxo e arquitetura futurista' },
          { id: 'bali', title: 'Bali', description: 'Praias, templos e espiritualidade' },
          { id: 'sydney', title: 'Sydney', description: 'Opera House e praias incríveis' },
        ]
      },
    ]
  }
}
