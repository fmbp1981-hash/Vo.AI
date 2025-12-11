/**
 * Opportunities Service
 * 
 * Identifica oportunidades de relacionamento com clientes:
 * - Aniversários próximos (30, 15, 7, 1 dias)
 * - Marcos de serviços contratados (5, 10, 15, 20...)
 */

import { db } from './db'

export interface OpportunityItem {
    id: string
    leadId: string
    leadName: string
    leadPhone?: string
    leadEmail?: string
    type: 'birthday' | 'milestone'
    priority: 'urgent' | 'high' | 'medium' | 'low'
    daysUntil: number
    title: string
    description: string
    icon: string
    actionSuggestion: string
    metadata?: {
        dataNascimento?: string
        servicesCount?: number
        milestone?: number
    }
}

export class OpportunitiesService {
    /**
     * Obter todas as oportunidades ativas
     */
    static async getOpportunities(tenantId?: string): Promise<{
        birthdays: OpportunityItem[]
        milestones: OpportunityItem[]
    }> {
        const birthdays = await this.getBirthdayOpportunities(tenantId)
        const milestones = await this.getMilestoneOpportunities(tenantId)

        return { birthdays, milestones }
    }

    /**
     * Obter oportunidades de aniversário
     * Filtrar por 30, 15, 7, 1 dias
     */
    static async getBirthdayOpportunities(tenantId?: string): Promise<OpportunityItem[]> {
        const opportunities: OpportunityItem[] = []
        const today = new Date()

        // Buscar todos os leads com data de nascimento
        const leads = await db.lead.findMany({
            where: {
                ...(tenantId && { tenantId }),
                dataNascimento: { not: null },
                estagio: { notIn: ['Cancelado', 'Não Qualificado'] },
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                email: true,
                dataNascimento: true,
            },
        })

        for (const lead of leads) {
            if (!lead.dataNascimento) continue

            const daysUntil = this.getDaysUntilBirthday(lead.dataNascimento)

            // Filtrar apenas os relevantes: 30, 15, 7, 3, 1, 0 dias
            if (daysUntil <= 30) {
                let priority: OpportunityItem['priority'] = 'low'
                let title = ''
                let actionSuggestion = ''

                if (daysUntil === 0) {
                    priority = 'urgent'
                    title = `🎂 HOJE é aniversário de ${lead.nome}!`
                    actionSuggestion = 'Enviar mensagem de felicitações agora!'
                } else if (daysUntil === 1) {
                    priority = 'urgent'
                    title = `🎂 AMANHÃ é aniversário de ${lead.nome}`
                    actionSuggestion = 'Preparar mensagem de felicitações para amanhã'
                } else if (daysUntil <= 7) {
                    priority = 'high'
                    title = `🎂 Aniversário de ${lead.nome} em ${daysUntil} dias`
                    actionSuggestion = 'Planejar presente ou promoção especial'
                } else if (daysUntil <= 15) {
                    priority = 'medium'
                    title = `🎂 Aniversário de ${lead.nome} em ${daysUntil} dias`
                    actionSuggestion = 'Considerar campanha de aniversário'
                } else {
                    priority = 'low'
                    title = `🎂 Aniversário de ${lead.nome} em ${daysUntil} dias`
                    actionSuggestion = 'Lembrete para planejamento'
                }

                opportunities.push({
                    id: `birthday-${lead.id}`,
                    leadId: lead.id,
                    leadName: lead.nome,
                    leadPhone: lead.telefone || undefined,
                    leadEmail: lead.email || undefined,
                    type: 'birthday',
                    priority,
                    daysUntil,
                    title,
                    description: `Data: ${lead.dataNascimento}`,
                    icon: '🎂',
                    actionSuggestion,
                    metadata: {
                        dataNascimento: lead.dataNascimento,
                    },
                })
            }
        }

        // Ordenar por urgência (dias até)
        return opportunities.sort((a, b) => a.daysUntil - b.daysUntil)
    }

    /**
     * Obter oportunidades de marcos de serviços
     * Marcos: 5, 10, 15, 20, 25, 30...
     */
    static async getMilestoneOpportunities(tenantId?: string): Promise<OpportunityItem[]> {
        const opportunities: OpportunityItem[] = []
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50]

        // Buscar leads com contagem de propostas fechadas
        const leads = await db.lead.findMany({
            where: {
                ...(tenantId && { tenantId }),
                estagio: { notIn: ['Cancelado', 'Não Qualificado'] },
            },
            include: {
                proposals: {
                    where: {
                        status: { in: ['signed', 'sent'] },
                    },
                },
            },
        })

        // Agrupar por nome/telefone para contar serviços únicos
        const clientServices = new Map<string, { lead: any; count: number }>()

        for (const lead of leads) {
            const key = lead.telefoneNormalizado || lead.email || lead.nome
            const existing = clientServices.get(key)

            if (existing) {
                existing.count += lead.proposals.length
            } else {
                clientServices.set(key, {
                    lead,
                    count: lead.proposals.length,
                })
            }
        }

        // Verificar quem está próximo de um marco
        for (const [, data] of clientServices) {
            const { lead, count } = data

            for (const milestone of milestones) {
                // Se está no marco exato ou a 1-2 serviços de atingir
                const difference = milestone - count

                if (difference === 0) {
                    // Atingiu o marco!
                    opportunities.push({
                        id: `milestone-${lead.id}-${milestone}`,
                        leadId: lead.id,
                        leadName: lead.nome,
                        leadPhone: lead.telefone || undefined,
                        leadEmail: lead.email || undefined,
                        type: 'milestone',
                        priority: 'high',
                        daysUntil: 0,
                        title: `🏆 ${lead.nome} completou ${milestone} serviços!`,
                        description: `Cliente fiel - oferecer benefício especial`,
                        icon: '🏆',
                        actionSuggestion: this.getMilestoneAction(milestone),
                        metadata: {
                            servicesCount: count,
                            milestone,
                        },
                    })
                } else if (difference > 0 && difference <= 2) {
                    // Próximo de atingir
                    opportunities.push({
                        id: `near-milestone-${lead.id}-${milestone}`,
                        leadId: lead.id,
                        leadName: lead.nome,
                        leadPhone: lead.telefone || undefined,
                        leadEmail: lead.email || undefined,
                        type: 'milestone',
                        priority: 'medium',
                        daysUntil: difference, // Usamos como "distância" do marco
                        title: `📈 ${lead.nome} está a ${difference} serviço(s) do marco ${milestone}`,
                        description: `${count}/${milestone} serviços contratados`,
                        icon: '📈',
                        actionSuggestion: `Incentivar contratação para atingir o marco de ${milestone}`,
                        metadata: {
                            servicesCount: count,
                            milestone,
                        },
                    })
                }
            }
        }

        // Ordenar por prioridade
        return opportunities.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
    }

    /**
     * Calcular dias até o próximo aniversário
     */
    private static getDaysUntilBirthday(dataNascimento: string): number {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Extrair dia e mês da data de nascimento
        let day: number, month: number

        if (dataNascimento.includes('/')) {
            const parts = dataNascimento.split('/')
            day = parseInt(parts[0])
            month = parseInt(parts[1]) - 1 // JS months are 0-indexed
        } else if (dataNascimento.includes('-')) {
            const parts = dataNascimento.split('-')
            if (parts[0].length === 4) {
                // Formato YYYY-MM-DD
                month = parseInt(parts[1]) - 1
                day = parseInt(parts[2])
            } else {
                // Formato DD-MM-YYYY
                day = parseInt(parts[0])
                month = parseInt(parts[1]) - 1
            }
        } else {
            return 999 // Formato inválido
        }

        // Criar data do aniversário este ano
        const thisYear = today.getFullYear()
        let birthday = new Date(thisYear, month, day)

        // Se já passou, calcular para o próximo ano
        if (birthday < today) {
            birthday = new Date(thisYear + 1, month, day)
        }

        // Calcular diferença em dias
        const diffTime = birthday.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return diffDays
    }

    /**
     * Sugestão de ação baseada no marco
     */
    private static getMilestoneAction(milestone: number): string {
        switch (milestone) {
            case 5:
                return 'Oferecer 5% de desconto no próximo pacote'
            case 10:
                return 'Oferecer upgrade gratuito ou 10% de desconto'
            case 15:
                return 'Convidar para programa VIP com benefícios exclusivos'
            case 20:
                return 'Oferecer viagem cortesia ou desconto de 15%'
            case 25:
                return 'Presente especial + cartão de cliente premiado'
            case 30:
                return 'Viagem de premiação ou desconto de 20%'
            default:
                return `Oferecer benefício especial por ${milestone} serviços`
        }
    }

    /**
     * Obter resumo de oportunidades para dashboard
     */
    static async getOpportunitiesSummary(tenantId?: string): Promise<{
        urgentCount: number
        highCount: number
        mediumCount: number
        lowCount: number
        totalBirthdays: number
        totalMilestones: number
    }> {
        const { birthdays, milestones } = await this.getOpportunities(tenantId)
        const all = [...birthdays, ...milestones]

        return {
            urgentCount: all.filter(o => o.priority === 'urgent').length,
            highCount: all.filter(o => o.priority === 'high').length,
            mediumCount: all.filter(o => o.priority === 'medium').length,
            lowCount: all.filter(o => o.priority === 'low').length,
            totalBirthdays: birthdays.length,
            totalMilestones: milestones.length,
        }
    }
}

export default OpportunitiesService
