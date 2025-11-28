import { db } from './db'
import { sendNotification } from './notifications'

// Tipos de triggers disponíveis
export const TRIGGERS = {
  LEAD_CREATED: 'lead_created',
  STAGE_CHANGED: 'stage_changed',
  NO_CONTACT_3DAYS: 'no_contact_3days',
  NO_CONTACT_7DAYS: 'no_contact_7days',
  PROPOSAL_SENT: 'proposal_sent',
  PROPOSAL_VIEWED: 'proposal_viewed',
  BUDGET_HIGH: 'budget_high',
  SCORE_HIGH: 'score_high',
} as const

// Tipos de ações disponíveis
export const ACTIONS = {
  CREATE_TASK: 'create_task',
  SEND_EMAIL: 'send_email',
  SEND_WHATSAPP: 'send_whatsapp',
  NOTIFY_USER: 'notify_user',
  UPDATE_SCORE: 'update_score',
  MOVE_STAGE: 'move_stage',
  ASSIGN_USER: 'assign_user',
} as const

interface AutomationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

interface AutomationAction {
  type: keyof typeof ACTIONS
  params: any
}

// Motor de automação principal
export class AutomationEngine {
  // Processar automações para um evento específico
  static async processEvent(
    trigger: string,
    data: any
  ): Promise<void> {
    try {
      // Buscar automações ativas para este trigger
      const automations = await db.automation.findMany({
        where: {
          trigger,
          isActive: true,
        },
      })

      for (const automation of automations) {
        const conditions = JSON.parse(automation.conditions) as AutomationCondition[]
        const actions = JSON.parse(automation.actions) as AutomationAction[]

        // Verificar condições
        if (this.checkConditions(conditions, data)) {
          // Executar ações
          await this.executeActions(actions, data)
        }
      }
    } catch (error) {
      console.error('Error processing automation:', error)
    }
  }

  // Verificar se as condições são atendidas
  private static checkConditions(
    conditions: AutomationCondition[],
    data: any
  ): boolean {
    if (conditions.length === 0) return true

    return conditions.every((condition) => {
      const value = this.getNestedValue(data, condition.field)

      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'not_equals':
          return value !== condition.value
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'greater_than':
          return Number(value) > Number(condition.value)
        case 'less_than':
          return Number(value) < Number(condition.value)
        default:
          return false
      }
    })
  }

  // Executar ações da automação
  private static async executeActions(
    actions: AutomationAction[],
    data: any
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'create_task':
            await this.createTask(action.params, data)
            break
          case 'send_email':
            await this.sendEmail(action.params, data)
            break
          case 'send_whatsapp':
            await this.sendWhatsApp(action.params, data)
            break
          case 'notify_user':
            await this.notifyUser(action.params, data)
            break
          case 'update_score':
            await this.updateScore(action.params, data)
            break
          case 'move_stage':
            await this.moveStage(action.params, data)
            break
          case 'assign_user':
            await this.assignUser(action.params, data)
            break
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error)
      }
    }
  }

  // Ações específicas
  private static async createTask(params: any, data: any): Promise<void> {
    const lead = data.lead || data
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + (params.daysOffset || 1))

    await db.task.create({
      data: {
        leadId: lead.id,
        userId: lead.assignedTo || params.userId,
        type: params.type || 'follow_up',
        title: this.replacePlaceholders(params.title, data),
        description: params.description ? this.replacePlaceholders(params.description, data) : null,
        priority: params.priority || 'medium',
        dueDate,
        reminderAt: params.reminder ? new Date(dueDate.getTime() - params.reminder * 60000) : null,
        autoCreated: true,
      },
    })

    // Notificar usuário
    if (lead.assignedTo) {
      await sendNotification({
        userId: lead.assignedTo,
        type: 'task',
        title: 'Nova tarefa criada',
        message: this.replacePlaceholders(params.title, data),
        link: `/leads/${lead.id}`,
      })
    }
  }

  private static async sendEmail(params: any, data: any): Promise<void> {
    // TODO: Implementar envio de email
    console.log('Send email:', params, data)
  }

  private static async sendWhatsApp(params: any, data: any): Promise<void> {
    // TODO: Implementar envio de WhatsApp
    console.log('Send WhatsApp:', params, data)
  }

  private static async notifyUser(params: any, data: any): Promise<void> {
    const lead = data.lead || data
    const userId = params.userId || lead.assignedTo

    if (userId) {
      await sendNotification({
        userId,
        type: params.type || 'system',
        title: this.replacePlaceholders(params.title, data),
        message: this.replacePlaceholders(params.message, data),
        link: params.link ? this.replacePlaceholders(params.link, data) : null,
      })
    }
  }

  private static async updateScore(params: any, data: any): Promise<void> {
    const lead = data.lead || data
    const newScore = Math.min(100, Math.max(0, lead.score + (params.change || 0)))

    await db.lead.update({
      where: { id: lead.id },
      data: { score: newScore },
    })
  }

  private static async moveStage(params: any, data: any): Promise<void> {
    const lead = data.lead || data

    await db.lead.update({
      where: { id: lead.id },
      data: {
        estagio: params.stage,
        status: params.stage,
      },
    })
  }

  private static async assignUser(params: any, data: any): Promise<void> {
    const lead = data.lead || data

    await db.lead.update({
      where: { id: lead.id },
      data: {
        assignedTo: params.userId,
        assignedAt: new Date(),
      },
    })

    // Notificar novo responsável
    await sendNotification({
      userId: params.userId,
      type: 'lead',
      title: 'Novo lead atribuído',
      message: `Lead ${lead.nome} foi atribuído a você`,
      link: `/leads/${lead.id}`,
    })
  }

  // Utilitários
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private static replacePlaceholders(text: string, data: any): string {
    const lead = data.lead || data
    return text
      .replace(/\{lead\.nome\}/g, lead.nome || '')
      .replace(/\{lead\.destino\}/g, lead.destino || '')
      .replace(/\{lead\.estagio\}/g, lead.estagio || '')
      .replace(/\{lead\.orcamento\}/g, lead.orcamento || '')
  }
}

// Criar automações padrão
export async function createDefaultAutomations() {
  const automations = [
    {
      name: 'Follow-up após 3 dias sem contato',
      description: 'Cria tarefa de follow-up se lead ficar 3 dias sem contato',
      trigger: TRIGGERS.NO_CONTACT_3DAYS,
      conditions: JSON.stringify([
        { field: 'estagio', operator: 'not_equals', value: 'Fechado' },
        { field: 'estagio', operator: 'not_equals', value: 'Cancelado' },
      ]),
      actions: JSON.stringify([
        {
          type: 'create_task',
          params: {
            type: 'follow_up',
            title: 'Follow-up: {lead.nome}',
            description: 'Lead sem contato há 3 dias. Verificar interesse.',
            priority: 'medium',
            daysOffset: 0,
            reminder: 60, // 1h antes
          },
        },
        {
          type: 'notify_user',
          params: {
            type: 'lead',
            title: 'Lead sem contato há 3 dias',
            message: 'Lead {lead.nome} está sem contato há 3 dias',
            link: '/leads/{lead.id}',
          },
        },
      ]),
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Follow-up após proposta enviada',
      description: 'Cria tarefa de follow-up 1 dia após envio de proposta',
      trigger: TRIGGERS.PROPOSAL_SENT,
      conditions: JSON.stringify([]),
      actions: JSON.stringify([
        {
          type: 'create_task',
          params: {
            type: 'call',
            title: 'Ligar para {lead.nome} - Proposta',
            description: 'Verificar se recebeu e tem dúvidas sobre a proposta',
            priority: 'high',
            daysOffset: 1,
            reminder: 120,
          },
        },
      ]),
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Lead qualificado com alto orçamento',
      description: 'Notifica gerente quando lead qualificado tem orçamento alto',
      trigger: TRIGGERS.LEAD_CREATED,
      conditions: JSON.stringify([
        { field: 'qualificado', operator: 'equals', value: true },
        { field: 'score', operator: 'greater_than', value: 70 },
      ]),
      actions: JSON.stringify([
        {
          type: 'notify_user',
          params: {
            userId: 'manager-id', // TODO: Buscar gerente
            type: 'lead',
            title: 'Lead VIP detectado',
            message: 'Lead qualificado {lead.nome} com alto potencial',
            link: '/leads/{lead.id}',
          },
        },
        {
          type: 'create_task',
          params: {
            type: 'call',
            title: 'Contato prioritário: {lead.nome}',
            description: 'Lead VIP - contato imediato',
            priority: 'urgent',
            daysOffset: 0,
            reminder: 30,
          },
        },
      ]),
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Atualizar score ao mover para Qualificação',
      description: 'Aumenta score quando lead avança para qualificação',
      trigger: TRIGGERS.STAGE_CHANGED,
      conditions: JSON.stringify([
        { field: 'newStage', operator: 'equals', value: 'Qualificação' },
      ]),
      actions: JSON.stringify([
        {
          type: 'update_score',
          params: {
            change: 10,
          },
        },
      ]),
      isActive: true,
      createdBy: 'system',
    },
    {
      name: 'Reunião após proposta visualizada',
      description: 'Agenda reunião quando proposta é visualizada',
      trigger: TRIGGERS.PROPOSAL_VIEWED,
      conditions: JSON.stringify([]),
      actions: JSON.stringify([
        {
          type: 'create_task',
          params: {
            type: 'meeting',
            title: 'Reunião com {lead.nome}',
            description: 'Proposta foi visualizada. Agendar call para tirar dúvidas.',
            priority: 'high',
            daysOffset: 0,
            reminder: 60,
          },
        },
        {
          type: 'update_score',
          params: {
            change: 15,
          },
        },
      ]),
      isActive: true,
      createdBy: 'system',
    },
  ]

  for (const automation of automations) {
    await db.automation.upsert({
      where: { id: automation.name }, // Usar name como unique identifier
      update: automation,
      create: automation as any,
    })
  }
}
