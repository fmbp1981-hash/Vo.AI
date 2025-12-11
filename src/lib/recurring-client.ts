/**
 * Recurring Client Service
 * 
 * Lógica para tratar clientes recorrentes que retornam para novo atendimento
 */

import { db } from './db'
import { sendNotification } from './notifications'

export interface RecurringClientResult {
    isRecurring: boolean
    existingLead: any
    newLead?: any
    lastService?: string
    welcomeMessage?: string
}

export class RecurringClientService {
    /**
     * Verificar se cliente é recorrente pelo telefone
     */
    static async checkRecurringClient(
        telefoneNormalizado: string,
        tenantId: string
    ): Promise<RecurringClientResult> {
        // Buscar lead existente pelo telefone
        const existingLead = await db.lead.findFirst({
            where: {
                tenantId,
                telefoneNormalizado,
            },
            orderBy: {
                created: 'desc',
            },
            include: {
                proposals: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                itineraries: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        if (!existingLead) {
            return {
                isRecurring: false,
                existingLead: null,
            }
        }

        // Construir resumo do último serviço
        let lastService = ''
        if (existingLead.proposals.length > 0) {
            lastService = `Última proposta: ${existingLead.proposals[0].title}`
        } else if (existingLead.itineraries.length > 0) {
            lastService = `Último roteiro: ${existingLead.itineraries[0].title} para ${existingLead.itineraries[0].destination}`
        } else if (existingLead.destino) {
            lastService = `Último interesse: viagem para ${existingLead.destino}`
        }

        return {
            isRecurring: true,
            existingLead,
            lastService,
        }
    }

    /**
     * Processar cliente recorrente: marcar anterior e criar novo registro
     */
    static async processRecurringClient(
        telefoneNormalizado: string,
        tenantId: string,
        userId?: string
    ): Promise<RecurringClientResult> {
        const check = await this.checkRecurringClient(telefoneNormalizado, tenantId)

        if (!check.isRecurring || !check.existingLead) {
            return check
        }

        const existingLead = check.existingLead

        try {
            // Marcar lead anterior como recorrente
            await db.lead.update({
                where: { id: existingLead.id },
                data: {
                    recorrente: true,
                    observacoes: `${existingLead.observacoes || ''}\n\n[RECORRENTE] Cliente retornou em ${new Date().toLocaleDateString('pt-BR')}`,
                },
            })

            // Criar novo registro copiando dados
            const newLead = await db.lead.create({
                data: {
                    tenantId,
                    nome: existingLead.nome,
                    telefone: existingLead.telefone,
                    telefoneNormalizado: existingLead.telefoneNormalizado,
                    email: existingLead.email,
                    dataNascimento: existingLead.dataNascimento,
                    canal: existingLead.canal,
                    estagio: 'Recorrente',
                    status: 'Recorrente',
                    recorrente: true,
                    assignedTo: userId || existingLead.assignedTo,
                    observacoes: `Cliente recorrente. Atendimento anterior: ${check.lastService || 'N/A'}`,
                    source: existingLead.source,
                },
            })

            // Gerar mensagem de boas-vindas personalizada
            const primeiroNome = existingLead.nome.split(' ')[0]
            const welcomeMessage = this.generateWelcomeBackMessage(primeiroNome, check.lastService)

            // Notificar consultor
            if (newLead.assignedTo) {
                await sendNotification({
                    userId: newLead.assignedTo,
                    type: 'recurring_client',
                    title: '🔄 Cliente Recorrente!',
                    message: `${existingLead.nome} voltou para novo atendimento. ${check.lastService || ''}`,
                    link: `/crm`,
                })
            }

            console.log(`[RecurringClient] Novo registro criado para cliente recorrente: ${existingLead.nome}`)

            return {
                isRecurring: true,
                existingLead,
                newLead,
                lastService: check.lastService,
                welcomeMessage,
            }
        } catch (error) {
            console.error('[RecurringClient] Erro ao processar cliente recorrente:', error)
            throw error
        }
    }

    /**
     * Gerar mensagem de boas-vindas para cliente recorrente
     */
    static generateWelcomeBackMessage(nome: string, lastService?: string): string {
        let message = `Olá, ${nome}! 😊\n\nQue alegria ter você de volta com a AGIR Viagens! 🌟`

        if (lastService) {
            message += `\n\n${lastService}. Esperamos que tenha sido uma experiência incrível!`
        }

        message += `\n\nPosso confirmar os dados que temos em nosso cadastro?\n`
        message += `\nEstamos prontos para ajudar você em uma nova viagem! Qual destino está em seus planos desta vez? 🌍✈️`

        return message
    }

    /**
     * Confirmar dados do cliente recorrente
     */
    static generateDataConfirmationMessage(lead: any): string {
        const dados = []

        if (lead.nome) dados.push(`📌 Nome: ${lead.nome}`)
        if (lead.telefone) dados.push(`📱 Telefone: ${lead.telefone}`)
        if (lead.email) dados.push(`📧 Email: ${lead.email}`)
        if (lead.dataNascimento) dados.push(`🎂 Nascimento: ${lead.dataNascimento}`)

        return `Tenho os seguintes dados cadastrados:\n\n${dados.join('\n')}\n\nEstão corretos? 😊`
    }
}

export default RecurringClientService
