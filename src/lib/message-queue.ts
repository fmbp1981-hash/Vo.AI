/**
 * Message Queue Service
 * 
 * Sistema de fila de mensagens com delays humanizados
 * para tornar as respostas da IA mais naturais
 */

// Configuração de delays humanizados
const HUMANIZATION_CONFIG = {
    // Delay mínimo e máximo antes de responder (ms)
    minDelay: 1000,
    maxDelay: 3000,

    // Tempo de leitura por caractere (ms)
    readingTimePerChar: 50,

    // Tempo máximo de leitura
    maxReadingTime: 5000,

    // Delay extra para mensagens longas
    longMessageThreshold: 200,
    longMessageExtraDelay: 1500,

    // Delay para simular digitação (ms por caractere da resposta)
    typingTimePerChar: 30,
    maxTypingTime: 8000,
}

export interface QueuedMessage {
    id: string
    leadId: string
    conversationId: string
    channel: 'whatsapp' | 'instagram' | 'webchat'
    content: string
    sender: 'ai' | 'human'
    priority: 'normal' | 'high' | 'urgent'
    createdAt: Date
    scheduledFor: Date
    status: 'pending' | 'typing' | 'sent' | 'failed'
    recipientPhone?: string
}

export class MessageQueue {
    private static queue: QueuedMessage[] = []
    private static processing: boolean = false

    /**
     * Calcular delay humanizado baseado na mensagem recebida
     */
    static calculateReadingDelay(incomingMessage: string): number {
        const readingTime = Math.min(
            incomingMessage.length * HUMANIZATION_CONFIG.readingTimePerChar,
            HUMANIZATION_CONFIG.maxReadingTime
        )

        const baseDelay = Math.random() *
            (HUMANIZATION_CONFIG.maxDelay - HUMANIZATION_CONFIG.minDelay) +
            HUMANIZATION_CONFIG.minDelay

        // Adicionar delay extra para mensagens longas
        const longMessageDelay = incomingMessage.length > HUMANIZATION_CONFIG.longMessageThreshold
            ? HUMANIZATION_CONFIG.longMessageExtraDelay
            : 0

        return Math.round(baseDelay + readingTime + longMessageDelay)
    }

    /**
     * Calcular tempo de digitação baseado na resposta
     */
    static calculateTypingTime(responseMessage: string): number {
        return Math.min(
            responseMessage.length * HUMANIZATION_CONFIG.typingTimePerChar,
            HUMANIZATION_CONFIG.maxTypingTime
        )
    }

    /**
     * Adicionar mensagem à fila com delay humanizado
     */
    static async enqueue(
        message: Omit<QueuedMessage, 'id' | 'createdAt' | 'scheduledFor' | 'status'>,
        incomingMessageLength: number
    ): Promise<QueuedMessage> {
        const delay = this.calculateReadingDelay(
            'x'.repeat(incomingMessageLength) // Simular tamanho da mensagem
        )

        const queuedMessage: QueuedMessage = {
            ...message,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            scheduledFor: new Date(Date.now() + delay),
            status: 'pending',
        }

        this.queue.push(queuedMessage)

        // Iniciar processamento se não estiver rodando
        if (!this.processing) {
            this.processQueue()
        }

        return queuedMessage
    }

    /**
     * Processar fila de mensagens
     */
    private static async processQueue(): Promise<void> {
        if (this.processing) return
        this.processing = true

        while (this.queue.length > 0) {
            // Ordenar por scheduledFor e prioridade
            this.queue.sort((a, b) => {
                if (a.priority === 'urgent' && b.priority !== 'urgent') return -1
                if (b.priority === 'urgent' && a.priority !== 'urgent') return 1
                return a.scheduledFor.getTime() - b.scheduledFor.getTime()
            })

            const message = this.queue[0]
            const now = new Date()

            // Esperar até o momento agendado
            if (message.scheduledFor > now) {
                const waitTime = message.scheduledFor.getTime() - now.getTime()
                await this.sleep(waitTime)
            }

            // Atualizar status para digitando
            message.status = 'typing'

            // Simular tempo de digitação
            const typingTime = this.calculateTypingTime(message.content)

            // Enviar indicador de digitação (implementação depende do canal)
            await this.sendTypingIndicator(message)

            // Esperar tempo de digitação
            await this.sleep(typingTime)

            // Enviar mensagem
            try {
                await this.sendMessage(message)
                message.status = 'sent'
            } catch (error) {
                console.error('[MessageQueue] Erro ao enviar mensagem:', error)
                message.status = 'failed'
            }

            // Remover da fila
            this.queue.shift()
        }

        this.processing = false
    }

    /**
     * Enviar indicador de digitação
     */
    private static async sendTypingIndicator(message: QueuedMessage): Promise<void> {
        // Implementação depende do canal
        switch (message.channel) {
            case 'whatsapp':
                // Chamar API de typing do WhatsApp
                try {
                    // Import dinâmico para evitar dependência circular
                    const { getWhatsAppProvider } = await import('./whatsapp')
                    const whatsapp = getWhatsAppProvider()

                    // A maioria das APIs de WhatsApp não tem typing indicator público
                    // Mas podemos implementar se a API suportar
                    console.log(`[MessageQueue] Typing indicator for ${message.recipientPhone}`)
                } catch (error) {
                    // Silenciar erro se não suportar
                }
                break

            case 'webchat':
                // Emitir evento Socket.io
                try {
                    const { getIO } = await import('./socket')
                    const io = getIO()
                    if (io) {
                        io.to(`lead:${message.leadId}`).emit('chat:typing', {
                            conversationId: message.conversationId,
                            isTyping: true,
                        })
                    }
                } catch (error) {
                    // Silenciar erro
                }
                break
        }
    }

    /**
     * Enviar mensagem pelo canal apropriado
     */
    private static async sendMessage(message: QueuedMessage): Promise<void> {
        switch (message.channel) {
            case 'whatsapp':
                const { getWhatsAppProvider } = await import('./whatsapp')
                const whatsapp = getWhatsAppProvider()
                if (message.recipientPhone) {
                    await whatsapp.sendTextMessage(message.recipientPhone, message.content)
                }
                break

            case 'webchat':
                const { getIO } = await import('./socket')
                const io = getIO()
                if (io) {
                    io.to(`lead:${message.leadId}`).emit('chat:new_message', {
                        conversationId: message.conversationId,
                        message: message.content,
                        sender: message.sender,
                        timestamp: new Date().toISOString(),
                    })

                    // Parar indicador de digitação
                    io.to(`lead:${message.leadId}`).emit('chat:typing', {
                        conversationId: message.conversationId,
                        isTyping: false,
                    })
                }
                break
        }
    }

    /**
     * Utilitário para sleep
     */
    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Obter status da fila
     */
    static getQueueStatus(): { size: number; processing: boolean; messages: QueuedMessage[] } {
        return {
            size: this.queue.length,
            processing: this.processing,
            messages: [...this.queue],
        }
    }

    /**
     * Limpar fila
     */
    static clearQueue(): void {
        this.queue = []
        this.processing = false
    }
}

export default MessageQueue
