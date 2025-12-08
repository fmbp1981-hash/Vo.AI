/**
 * Humanizer - Divide respostas longas em mensagens naturais
 * Baseado na lógica do fluxo n8n "Humanizador"
 */

const MAX_MESSAGE_LENGTH = 240

/**
 * Divide uma resposta longa em múltiplas mensagens naturais
 * @param text - Texto completo da resposta
 * @returns Array de mensagens divididas
 */
export function humanizeResponse(text: string): string[] {
    if (!text || text.length <= MAX_MESSAGE_LENGTH) {
        return text ? [text.trim()] : []
    }

    // Remove caracteres especiais do RAG (se houver)
    text = text.replace(/【.*?】/g, '')

    // Divide em sentenças (pontos, exclamações, interrogações)
    const sentences = text.split(/(?<=[.!?])\s+/)
    const messages: string[] = []
    let currentMessage = ''

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim()
        if (!trimmedSentence) continue

        // Se adicionar essa sentença ultrapassa o limite
        if ((currentMessage + ' ' + trimmedSentence).trim().length > MAX_MESSAGE_LENGTH) {
            // Salva a mensagem atual se houver
            if (currentMessage.trim()) {
                messages.push(currentMessage.trim())
            }

            // Se a sentença sozinha é maior que o limite, divide por vírgulas
            if (trimmedSentence.length > MAX_MESSAGE_LENGTH) {
                const parts = splitLongSentence(trimmedSentence)
                messages.push(...parts.slice(0, -1))
                currentMessage = parts[parts.length - 1] || ''
            } else {
                currentMessage = trimmedSentence
            }
        } else {
            currentMessage = (currentMessage + ' ' + trimmedSentence).trim()
        }
    }

    // Adiciona última mensagem se houver
    if (currentMessage.trim()) {
        messages.push(currentMessage.trim())
    }

    // Remove mensagens vazias e aplica formatação WhatsApp
    return messages
        .filter(m => m.length > 0)
        .map(m => formatForWhatsApp(m))
}

/**
 * Divide sentenças muito longas por vírgulas ou em partes menores
 */
function splitLongSentence(sentence: string): string[] {
    // Tenta dividir por vírgulas primeiro
    const parts = sentence.split(/,\s*/)
    const result: string[] = []
    let current = ''

    for (const part of parts) {
        if ((current + ', ' + part).length > MAX_MESSAGE_LENGTH) {
            if (current) result.push(current.trim())
            current = part
        } else {
            current = current ? `${current}, ${part}` : part
        }
    }

    if (current) result.push(current.trim())

    // Se ainda tem partes muito longas, divide forçadamente
    return result.flatMap(part => {
        if (part.length > MAX_MESSAGE_LENGTH) {
            return forceChunk(part, MAX_MESSAGE_LENGTH)
        }
        return [part]
    })
}

/**
 * Divide texto forçadamente respeitando palavras
 */
function forceChunk(text: string, maxLength: number): string[] {
    const words = text.split(' ')
    const chunks: string[] = []
    let current = ''

    for (const word of words) {
        if ((current + ' ' + word).length > maxLength) {
            if (current) chunks.push(current.trim())
            current = word
        } else {
            current = (current + ' ' + word).trim()
        }
    }

    if (current) chunks.push(current.trim())
    return chunks
}

/**
 * Aplica formatação do WhatsApp
 * - Converte ** para * (negrito)
 * - Adiciona quebras de linha após listas
 */
function formatForWhatsApp(text: string): string {
    return text
        // Converte markdown ** para WhatsApp * (negrito)
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        // Garante que listas tenham quebra de linha
        .replace(/([.!?])\s*(-|\d+\.)/g, '$1\n\n$2')
}

/**
 * Calcula delay baseado no tamanho da mensagem (simula digitação)
 * @param message - Texto da mensagem
 * @returns Delay em milissegundos
 */
export function calculateTypingDelay(message: string): number {
    // ~50ms por caractere, mínimo 1s, máximo 3s
    const delay = Math.min(Math.max(message.length * 50, 1000), 3000)
    return delay
}

/**
 * Envia múltiplas mensagens com delay entre elas
 * @param messages - Array de mensagens
 * @param sendFn - Função para enviar cada mensagem
 */
export async function sendHumanizedMessages(
    messages: string[],
    sendFn: (message: string) => Promise<void>
): Promise<void> {
    for (let i = 0; i < messages.length; i++) {
        const message = messages[i]

        // Envia a mensagem
        await sendFn(message)

        // Delay entre mensagens (exceto a última)
        if (i < messages.length - 1) {
            const delay = calculateTypingDelay(message)
            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }
}
