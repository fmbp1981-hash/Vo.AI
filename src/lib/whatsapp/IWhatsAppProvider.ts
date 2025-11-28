/**
 * Interface abstrata para provedores de WhatsApp
 * Permite suportar múltiplos provedores (Evolution API, Z-API, WhatsApp Business API)
 * sem modificar o código da aplicação
 */

export interface WhatsAppMessage {
  number: string // Número no formato internacional (5511999999999)
  message: string
  mediaUrl?: string
  mediaType?: 'image' | 'document' | 'audio' | 'video'
  caption?: string
}

export interface WhatsAppButtonMessage {
  number: string
  title: string
  message: string
  footer?: string
  buttons: Array<{ id: string; displayText: string }>
}

export interface WhatsAppListMessage {
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
}

export interface WhatsAppConnectionStatus {
  state: 'open' | 'connecting' | 'close'
  status: 'connected' | 'disconnected' | 'connecting'
  qrCode?: string
}

export interface WhatsAppMessageResponse {
  messageId: string
  status: string
  timestamp?: string
}

/**
 * Interface que todo provider de WhatsApp deve implementar
 */
export interface IWhatsAppProvider {
  /**
   * Nome do provider (ex: 'evolution-api', 'z-api', 'whatsapp-business-api')
   */
  readonly providerName: string

  /**
   * Obter QR Code para conexão (usado no primeiro setup)
   */
  getQRCode(): Promise<{ qrcode: string; status: string }>

  /**
   * Verificar status de conexão da instância
   */
  getConnectionStatus(): Promise<WhatsAppConnectionStatus>

  /**
   * Enviar mensagem de texto simples
   */
  sendTextMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse>

  /**
   * Enviar mensagem com mídia (imagem, documento, áudio, vídeo)
   */
  sendMediaMessage(params: WhatsAppMessage): Promise<WhatsAppMessageResponse>

  /**
   * Enviar mensagem com botões interativos
   */
  sendButtonMessage(params: WhatsAppButtonMessage): Promise<WhatsAppMessageResponse>

  /**
   * Enviar mensagem com lista/menu
   */
  sendListMessage(params: WhatsAppListMessage): Promise<WhatsAppMessageResponse>

  /**
   * Obter URL da foto de perfil de um contato
   */
  getProfilePicture(number: string): Promise<{ profilePictureUrl?: string }>

  /**
   * Marcar mensagem como lida
   */
  markAsRead(params: { messageId: string; remoteJid: string }): Promise<void>

  /**
   * Obter histórico de mensagens de um chat
   */
  getChatHistory(number: string, limit?: number): Promise<any[]>

  /**
   * Fazer logout e desconectar da instância
   */
  logout(): Promise<void>

  /**
   * Verificar se o provider está configurado e pronto para uso
   */
  isConfigured(): boolean
}

/**
 * Configuração base para qualquer provider
 */
export interface WhatsAppProviderConfig {
  apiUrl: string
  apiKey: string
  instanceName?: string
  timeout?: number
}

/**
 * Tipos de providers suportados
 */
export enum WhatsAppProviderType {
  EVOLUTION_API = 'evolution-api',
  Z_API = 'z-api',
  WHATSAPP_BUSINESS_API = 'whatsapp-business-api',
}
