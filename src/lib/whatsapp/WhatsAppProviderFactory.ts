import {
    IWhatsAppProvider,
    WhatsAppProviderType,
    WhatsAppProviderConfig,
} from './IWhatsAppProvider'
import { EvolutionAPIProvider } from './EvolutionAPIProvider'
import { ZAPIProvider } from './ZAPIProvider'

/**
 * Factory para criar instâncias de provedores de WhatsApp baseado em configuração
 * Permite trocar de provider sem modificar código
 */
export class WhatsAppProviderFactory {
    private static instance: IWhatsAppProvider | null = null

    /**
     * Cria ou retorna provider baseado na variável de ambiente WHATSAPP_PROVIDER
     * ou no tipo especificado
     */
    static getProvider(
        providerType?: WhatsAppProviderType,
        config?: WhatsAppProviderConfig
    ): IWhatsAppProvider {
        // Se já existe uma instância e não foi solicitado um provider específico, retornar
        if (this.instance && !providerType) {
            return this.instance
        }

        // Determinar qual provider usar
        const type = providerType || this.getProviderTypeFromEnv()

        // Criar instância do provider apropriado
        let provider: IWhatsAppProvider

        switch (type) {
            case WhatsAppProviderType.EVOLUTION_API:
                provider = new EvolutionAPIProvider(config)
                break

            case WhatsAppProviderType.Z_API:
                provider = new ZAPIProvider(config)
                break

            case WhatsAppProviderType.WHATSAPP_BUSINESS_API:
                // TODO: Implementar WhatsAppBusinessAPIProvider
                throw new Error('WhatsApp Business API provider not yet implemented')

            default:
                console.warn(`Unknown provider type: ${type}. Defaulting to Evolution API.`)
                provider = new EvolutionAPIProvider(config)
        }

        // Verificar se está configurado
        if (!provider.isConfigured()) {
            console.warn(
                `[WhatsAppFactory] Provider ${provider.providerName} is not properly configured. ` +
                `Please check your environment variables.`
            )
        }

        // Cachear instância se não foi especificado tipo customizado
        if (!providerType) {
            this.instance = provider
        }

        return provider
    }

    /**
     * Obter tipo de provider da variável de ambiente
     */
    private static getProviderTypeFromEnv(): WhatsAppProviderType {
        const envProvider = process.env.WHATSAPP_PROVIDER?.toLowerCase()

        switch (envProvider) {
            case 'evolution-api':
            case 'evolution':
                return WhatsAppProviderType.EVOLUTION_API

            case 'z-api':
            case 'zapi':
                return WhatsAppProviderType.Z_API

            case 'whatsapp-business-api':
            case 'business-api':
            case 'official':
                return WhatsAppProviderType.WHATSAPP_BUSINESS_API

            default:
                // Default para Evolution API
                return WhatsAppProviderType.EVOLUTION_API
        }
    }

    /**
     * Resetar instância (útil para testes)
     */
    static resetInstance(): void {
        this.instance = null
    }

    /**
     * Criar provider customizado para situações específicas
     */
    static createCustomProvider(
        type: WhatsAppProviderType,
        config: WhatsAppProviderConfig
    ): IWhatsAppProvider {
        return this.getProvider(type, config)
    }
}

/**
 * Helper para obter instância padrão do provider
 * Uso: const whatsapp = getWhatsAppProvider()
 */
export function getWhatsAppProvider(): IWhatsAppProvider {
    return WhatsAppProviderFactory.getProvider()
}

/**
 * Helper para criar provider customizado
 * Uso: const whatsapp = createWhatsAppProvider('z-api', config)
 */
export function createWhatsAppProvider(
    type: WhatsAppProviderType,
    config?: WhatsAppProviderConfig
): IWhatsAppProvider {
    return WhatsAppProviderFactory.createCustomProvider(type, config)
}
