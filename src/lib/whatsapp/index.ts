/**
 * Barrel export para facilitar importações
 * 
 * Uso:
 * import { getWhatsAppProvider, WhatsAppProviderType } from '@/lib/whatsapp'
 */

// Interfaces e tipos
export * from './IWhatsAppProvider'

// Providers
export { EvolutionAPIProvider } from './EvolutionAPIProvider'
export { ZAPIProvider } from './ZAPIProvider'

// Factory
export {
    WhatsAppProviderFactory,
    getWhatsAppProvider,
    createWhatsAppProvider,
} from './WhatsAppProviderFactory'

// Helper functions (mantidos do arquivo antigo para compatibilidade)
export {
    normalizePhoneNumber,
    formatPhoneNumber,
    createQuickReplyButtons,
    createDestinationMenu,
} from './helpers'
