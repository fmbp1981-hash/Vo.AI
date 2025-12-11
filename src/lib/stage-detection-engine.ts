/**
 * Stage Detection Engine
 * 
 * Analisa mensagens e detecta gatilhos para mudança automática de estágio
 * Baseado no prompt do agente Sofia da AGIR Viagens
 */

import { db } from './db'
import { sendNotification } from './notifications'

// Padrões de detecção de gatilhos
const STAGE_TRIGGERS = {
    // Qualificação: Destino + Datas/Período + Orçamento
    QUALIFICATION: {
        destination: [
            /(?:quero|vou|pretendo|gostaria|pensando em)\s*(?:ir|viajar|visitar|conhecer)\s*(?:para|pra|a|ao|à)?\s*([A-ZÀ-Úa-zà-ú\s]+)/i,
            /destino[:\s]+([A-ZÀ-Úa-zà-ú\s]+)/i,
            /(?:viagem|passeio|tour)\s*(?:para|pra|a|ao|à)\s*([A-ZÀ-Úa-zà-ú\s]+)/i,
        ],
        dates: [
            /(?:de|entre|no período de|saindo)\s*(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/i,
            /(?:partida|saída|ida)[:\s]*(\d{1,2})[\/\-](\d{1,2})/i,
            /(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i,
            /(?:próxim[ao]s?\s*(?:mês|semana|ano)|fim de ano|natal|ano novo|carnaval|páscoa|férias)/i,
        ],
        budget: [
            /(?:orçamento|budget|verba|posso gastar|disponível)[:\s]*(?:de\s*)?(?:R\$\s*)?(\d+[\.,]?\d*(?:\s*mil)?)/i,
            /(?:R\$\s*)?(\d+[\.,]?\d*(?:\s*mil)?)\s*(?:reais|por pessoa|no total)/i,
            /(?:até|máximo de|no máximo)\s*(?:R\$\s*)?(\d+[\.,]?\d*(?:\s*mil)?)/i,
        ],
    },

    // Gerar Proposta: cliente aceita gerar proposta
    GENERATE_PROPOSAL: [
        /(?:quero|pode|gostaria de)\s*(?:uma|receber|ver)\s*(?:proposta|cotação|orçamento)/i,
        /(?:pode|consegue)\s*(?:me\s*)?(?:enviar|mandar|fazer)\s*(?:uma\s*)?(?:proposta|cotação)/i,
        /(?:gere|gerar|fazer)\s*(?:uma\s*)?(?:proposta|cotação)/i,
        /(?:vamos|pode)\s*(?:fechar|confirmar|reservar)/i,
        /(?:quero\s*)?(?:prosseguir|avançar|continuar)/i,
        /(?:aceito|concordo|ok|sim|vamos lá|bora|fechou)/i,
    ],

    // Cancelamento
    CANCELLATION: [
        /(?:quero|preciso|vou)\s*(?:cancelar|desistir)/i,
        /(?:não\s*)?(?:quero|vou|posso)\s*(?:mais\s*)?(?:prosseguir|continuar|avançar)/i,
        /(?:desisto|cancela|esqueça|deixa pra lá)/i,
        /(?:não\s*tenho\s*mais\s*interesse)/i,
    ],

    // Não Qualificado
    NOT_QUALIFIED: [
        /(?:só|apenas)\s*(?:pesquisando|olhando|curiosidade)/i,
        /(?:não\s*)?(?:tenho|vou)\s*(?:dinheiro|grana|orçamento)/i,
        /(?:muito\s*)?(?:caro|dispendioso|fora do orçamento)/i,
        /(?:talvez|quem sabe)\s*(?:ano|mês|depois)\s*(?:que vem|próximo)/i,
    ],

    // Handover para humano
    HUMAN_HANDOVER: [
        /(?:falar|conversar)\s*(?:com\s*)?(?:um\s*)?(?:humano|pessoa|atendente|consultor)/i,
        /(?:quero|preciso\s*de)\s*(?:um\s*)?(?:consultor|atendente|especialista)/i,
        /(?:pessoa\s*real|de\s*verdade)/i,
    ],
}

export interface StageDetectionResult {
    detected: boolean
    newStage: string | null
    triggerType: string | null
    extractedData: {
        destino?: string
        datas?: string
        orcamento?: string
        motivoCancelamento?: string
    }
    shouldHandover: boolean
    confidence: number
}

export class StageDetectionEngine {
    /**
     * Analisar mensagem e detectar gatilho de mudança de estágio
     */
    static analyzeMessage(message: string, currentStage: string, leadData?: any): StageDetectionResult {
        const result: StageDetectionResult = {
            detected: false,
            newStage: null,
            triggerType: null,
            extractedData: {},
            shouldHandover: false,
            confidence: 0,
        }

        // Verificar cancelamento primeiro (prioridade alta)
        if (this.matchesPatterns(message, STAGE_TRIGGERS.CANCELLATION)) {
            result.detected = true
            result.newStage = 'Cancelado'
            result.triggerType = 'cancellation'
            result.extractedData.motivoCancelamento = this.extractCancellationReason(message)
            result.confidence = 0.8
            return result
        }

        // Verificar se quer falar com humano
        if (this.matchesPatterns(message, STAGE_TRIGGERS.HUMAN_HANDOVER)) {
            result.shouldHandover = true
            result.triggerType = 'human_handover'
            result.confidence = 0.9
        }

        // Verificar Gerar Proposta (após qualificação)
        if (currentStage === 'Qualificação' && this.matchesPatterns(message, STAGE_TRIGGERS.GENERATE_PROPOSAL)) {
            result.detected = true
            result.newStage = 'Gerar Proposta'
            result.triggerType = 'generate_proposal'
            result.shouldHandover = true  // Handover para consultor gerar proposta
            result.confidence = 0.85
            return result
        }

        // Verificar não qualificado
        if (this.matchesPatterns(message, STAGE_TRIGGERS.NOT_QUALIFIED)) {
            result.detected = true
            result.newStage = 'Não Qualificado'
            result.triggerType = 'not_qualified'
            result.confidence = 0.7
            return result
        }

        // Verificar qualificação (Destino + Datas + Orçamento)
        const qualificationData = this.checkQualification(message, leadData)
        if (qualificationData.isQualified) {
            result.detected = true
            result.newStage = 'Qualificação'
            result.triggerType = 'qualification'
            result.extractedData = qualificationData.data
            result.confidence = 0.9
            return result
        }

        // Extrair dados parciais mesmo sem mudar estágio
        result.extractedData = this.extractPartialData(message)

        return result
    }

    /**
     * Verificar se tem dados suficientes para qualificação
     */
    private static checkQualification(message: string, leadData?: any): { isQualified: boolean; data: any } {
        const data: any = {}
        let hasDestino = !!leadData?.destino
        let hasDatas = !!leadData?.dataPartida || !!leadData?.periodo
        let hasOrcamento = !!leadData?.orcamento

        // Verificar destino na mensagem
        for (const pattern of STAGE_TRIGGERS.QUALIFICATION.destination) {
            const match = message.match(pattern)
            if (match) {
                data.destino = match[1]?.trim()
                hasDestino = true
                break
            }
        }

        // Verificar datas na mensagem
        for (const pattern of STAGE_TRIGGERS.QUALIFICATION.dates) {
            if (pattern.test(message)) {
                data.datas = message
                hasDatas = true
                break
            }
        }

        // Verificar orçamento na mensagem
        for (const pattern of STAGE_TRIGGERS.QUALIFICATION.budget) {
            const match = message.match(pattern)
            if (match) {
                data.orcamento = match[1]
                hasOrcamento = true
                break
            }
        }

        return {
            isQualified: hasDestino && hasDatas && hasOrcamento,
            data,
        }
    }

    /**
     * Extrair dados parciais da mensagem
     */
    private static extractPartialData(message: string): any {
        const data: any = {}

        // Tentar extrair destino
        for (const pattern of STAGE_TRIGGERS.QUALIFICATION.destination) {
            const match = message.match(pattern)
            if (match) {
                data.destino = match[1]?.trim()
                break
            }
        }

        // Tentar extrair orçamento
        for (const pattern of STAGE_TRIGGERS.QUALIFICATION.budget) {
            const match = message.match(pattern)
            if (match) {
                data.orcamento = match[1]
                break
            }
        }

        return data
    }

    /**
     * Extrair motivo de cancelamento
     */
    private static extractCancellationReason(message: string): string {
        const reasons = [
            { pattern: /mudei\s*de\s*ideia/i, reason: 'Mudou de ideia' },
            { pattern: /não\s*tenho\s*(?:mais\s*)?(?:tempo|disponibilidade)/i, reason: 'Sem disponibilidade' },
            { pattern: /não\s*tenho\s*(?:mais\s*)?(?:dinheiro|orçamento|verba)/i, reason: 'Orçamento' },
            { pattern: /encontrei\s*(?:outro|melhor)/i, reason: 'Encontrou outra opção' },
            { pattern: /adiou|adiar|postergar/i, reason: 'Adiou planos' },
        ]

        for (const { pattern, reason } of reasons) {
            if (pattern.test(message)) {
                return reason
            }
        }

        return 'Não informado'
    }

    /**
     * Verificar se mensagem corresponde a algum padrão
     */
    private static matchesPatterns(message: string, patterns: RegExp[]): boolean {
        return patterns.some(pattern => pattern.test(message))
    }

    /**
     * Processar detecção e atualizar lead no banco
     */
    static async processAndUpdateLead(
        leadId: string,
        message: string,
        currentStage: string,
        leadData?: any
    ): Promise<StageDetectionResult> {
        const detection = this.analyzeMessage(message, currentStage, leadData)

        if (detection.detected && detection.newStage) {
            try {
                // Atualizar lead no banco
                const updateData: any = {
                    estagio: detection.newStage,
                    status: detection.newStage,
                }

                // Adicionar dados extraídos
                if (detection.extractedData.destino) {
                    updateData.destino = detection.extractedData.destino
                }
                if (detection.extractedData.orcamento) {
                    updateData.orcamento = detection.extractedData.orcamento
                }
                if (detection.extractedData.motivoCancelamento) {
                    updateData.motivoCancelamento = detection.extractedData.motivoCancelamento
                }
                if (detection.newStage === 'Qualificação') {
                    updateData.qualificado = true
                }

                await db.lead.update({
                    where: { id: leadId },
                    data: updateData,
                })

                // Enviar notificação se for handover
                if (detection.shouldHandover) {
                    const lead = await db.lead.findUnique({ where: { id: leadId } })
                    if (lead?.assignedTo) {
                        await sendNotification({
                            userId: lead.assignedTo,
                            type: 'stage_change',
                            title: `🔔 Lead mudou para ${detection.newStage}`,
                            message: `${lead.nome} está aguardando atendimento humano`,
                            link: `/crm`,
                        })
                    }
                }

                console.log(`[StageDetection] Lead ${leadId} movido para ${detection.newStage}`)
            } catch (error) {
                console.error('[StageDetection] Erro ao atualizar lead:', error)
            }
        }

        return detection
    }
}

export default StageDetectionEngine
