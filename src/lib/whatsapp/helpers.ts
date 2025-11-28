/**
 * Helper functions para WhatsApp
 * Extraídas do whatsapp.ts original para manter compatibilidade
 */

/**
 * Normalize phone number to WhatsApp format
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
                ],
            },
            {
                title: 'Américas',
                rows: [
                    { id: 'nyc', title: 'Nova York', description: 'A cidade que nunca dorme' },
                    { id: 'miami', title: 'Miami', description: 'Praias e compras' },
                    { id: 'cancun', title: 'Cancún', description: 'Caribe mexicano paradisíaco' },
                    { id: 'buenosaires', title: 'Buenos Aires', description: 'Tango, vinho e charme' },
                ],
            },
            {
                title: 'Ásia & Oceania',
                rows: [
                    { id: 'tokyo', title: 'Tóquio', description: 'Tradição e tecnologia' },
                    { id: 'dubai', title: 'Dubai', description: 'Luxo e arquitetura futurista' },
                    { id: 'bali', title: 'Bali', description: 'Praias, templos e espiritualidade' },
                    { id: 'sydney', title: 'Sydney', description: 'Opera House e praias incríveis' },
                ],
            },
        ],
    }
}
