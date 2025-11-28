import { db } from './db'
import { sendNotification } from './notifications'

// Padrões que indicam necessidade de handover
const HANDOVER_PATTERNS = {
  // Intenção de compra forte
  BUY_INTENT: [
    /quero (fechar|confirmar|comprar|reservar)/i,
    /vamos (fechar|confirmar)/i,
    /(quando|como) (posso|faço) (o )?pagamento/i,
    /aceito a proposta/i,
    /pode (reservar|confirmar)/i,
    /quero prosseguir/i,
  ],

  // Perguntas complexas
  COMPLEX_QUESTIONS: [
    /falar com (um )?humano/i,
    /falar com (um )?(atendente|consultor|vendedor)/i,
    /pessoa (de verdade|real)/i,
    /preciso de ajuda (específica|especializada)/i,
    /caso (específico|complexo)/i,
  ],

  // Insatisfação / Problemas
  DISSATISFACTION: [
    /não (está|tá) (entendendo|ajudando)/i,
    /não (consegue|pode) (me )?ajudar/i,
    /(muito )?complicado/i,
    /problema (sério|urgente)/i,
    /reclamação/i,
    /insatisfeito/i,
  ],

  // Negociação / Personalização
  NEGOTIATION: [
    /negociar (o )?preço/i,
    /desconto (maior|especial)/i,
    /condições (especiais|personalizadas)/i,
    /customizar/i,
    /personalizar/i,
    /ajustar (o )?roteiro/i,
  ],

  // Urgência
  URGENCY: [
    /(é |muito |super )?urgente/i,
    /para (hoje|amanhã|já)/i,
    /preciso (agora|rápido)/i,
    /emergência/i,
  ],

  // Alto valor
  HIGH_VALUE: [
    /grupo (grande|de \d+)/i,
    /empresa/i,
    /corporativo/i,
    /evento/i,
  ],
}

// Scores para cada categoria
const CATEGORY_SCORES = {
  BUY_INTENT: 50,
  COMPLEX_QUESTIONS: 30,
  DISSATISFACTION: 40,
  NEGOTIATION: 35,
  URGENCY: 45,
  HIGH_VALUE: 40,
}

export interface HandoverAnalysis {
  shouldHandover: boolean
  score: number
  reasons: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  suggestedAction: string
}

export class HandoverEngine {
  // Analisar mensagem para decidir handover
  static analyzeMessage(message: string, context?: any): HandoverAnalysis {
    let score = 0
    const reasons: string[] = []

    // Verificar padrões na mensagem
    for (const [category, patterns] of Object.entries(HANDOVER_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          score += CATEGORY_SCORES[category as keyof typeof CATEGORY_SCORES]
          reasons.push(category.toLowerCase().replace('_', ' '))
          break // Só conta uma vez por categoria
        }
      }
    }

    // Análise de contexto
    if (context) {
      // Lead qualificado aumenta score
      if (context.lead?.qualificado) {
        score += 10
      }

      // Score alto do lead
      if (context.lead?.score > 70) {
        score += 15
        reasons.push('lead com alto score')
      }

      // Orçamento alto
      if (context.lead?.orcamento) {
        const valor = parseFloat(
          context.lead.orcamento.replace(/[R$\s.]/g, '').replace(',', '.')
        )
        if (valor > 10000) {
          score += 20
          reasons.push('orçamento alto')
        }
      }

      // Múltiplas tentativas da IA sem sucesso
      if (context.attempts > 2) {
        score += 25
        reasons.push('múltiplas tentativas sem resolução')
      }

      // Tempo de conversa longo (>10 minutos)
      if (context.conversationDuration > 600) {
        score += 15
        reasons.push('conversa prolongada')
      }

      // Proposta já enviada
      if (context.proposalSent) {
        score += 20
        reasons.push('proposta já enviada')
      }
    }

    // Determinar prioridade
    let priority: HandoverAnalysis['priority'] = 'low'
    if (score >= 80) priority = 'urgent'
    else if (score >= 60) priority = 'high'
    else if (score >= 40) priority = 'medium'

    // Sugerir ação
    let suggestedAction = 'Continuar com IA'
    if (score >= 50) {
      if (reasons.includes('buy_intent')) {
        suggestedAction = 'Transferir imediatamente para fechamento'
      } else if (reasons.includes('dissatisfaction')) {
        suggestedAction = 'Transferir para resolver insatisfação'
      } else if (reasons.includes('complex_questions')) {
        suggestedAction = 'Transferir para consultor especializado'
      } else {
        suggestedAction = 'Transferir para atendimento humano'
      }
    }

    return {
      shouldHandover: score >= 50,
      score,
      reasons,
      priority,
      suggestedAction,
    }
  }

  // Executar handover
  static async executeHandover(
    conversationId: string,
    analysis: HandoverAnalysis,
    context?: any
  ): Promise<void> {
    try {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { lead: true },
      })

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Encontrar melhor consultor disponível
      const consultant = await this.findBestConsultant(conversation.lead, analysis)

      if (!consultant) {
        console.warn('No consultant available for handover')
        return
      }

      // Atualizar conversa
      await db.conversation.update({
        where: { id: conversationId },
        data: {
          userId: consultant.id,
          status: 'waiting',
          assignedAt: new Date(),
        },
      })

      // Atualizar lead
      if (conversation.lead.assignedTo !== consultant.id) {
        await db.lead.update({
          where: { id: conversation.leadId },
          data: {
            assignedTo: consultant.id,
            assignedAt: new Date(),
          },
        })
      }

      // Criar notificação
      await sendNotification({
        userId: consultant.id,
        type: 'handover',
        title: `🔥 Handover ${analysis.priority.toUpperCase()}`,
        message: `${conversation.lead.nome} precisa de atendimento humano. Motivo: ${analysis.reasons.join(', ')}`,
        link: `/chat/${conversationId}`,
      })

      // Criar tarefa urgente
      await db.task.create({
        data: {
          leadId: conversation.leadId,
          userId: consultant.id,
          type: 'call',
          title: `Handover: ${conversation.lead.nome}`,
          description: `${analysis.suggestedAction}\n\nMotivos: ${analysis.reasons.join(', ')}\nScore: ${analysis.score}`,
          priority: analysis.priority === 'urgent' ? 'urgent' : 'high',
          dueDate: new Date(), // Imediato
          autoCreated: true,
        },
      })

      // Enviar mensagem de transição ao cliente
      const messages = JSON.parse(conversation.messages || '[]')
      messages.push({
        id: `handover-${Date.now()}`,
        role: 'system',
        content: `Entendo que você precisa de uma atenção mais personalizada. Estou conectando você com ${consultant.name}, nosso consultor especializado. Aguarde um momento, por favor! 😊`,
        timestamp: new Date().toISOString(),
      })

      await db.conversation.update({
        where: { id: conversationId },
        data: {
          messages: JSON.stringify(messages),
        },
      })

      console.log(
        `✅ Handover executed: ${conversation.lead.nome} → ${consultant.name} (priority: ${analysis.priority})`
      )
    } catch (error) {
      console.error('Error executing handover:', error)
      throw error
    }
  }

  // Encontrar melhor consultor
  private static async findBestConsultant(lead: any, analysis: HandoverAnalysis) {
    try {
      // Se já tem consultor atribuído, retornar ele
      if (lead.assignedTo) {
        const existing = await db.user.findUnique({
          where: { id: lead.assignedTo, isActive: true },
        })
        if (existing) return existing
      }

      // Buscar consultores ativos
      const consultants = await db.user.findMany({
        where: {
          isActive: true,
          role: {
            in: ['consultant', 'manager'],
          },
        },
      })

      if (consultants.length === 0) return null

      // Contar leads ativos por consultor
      const consultantLoads = await Promise.all(
        consultants.map(async (c) => {
          const activeLeads = await db.lead.count({
            where: {
              assignedTo: c.id,
              estagio: {
                notIn: ['Fechado', 'Cancelado'],
              },
            },
          })
          return { consultant: c, load: activeLeads }
        })
      )

      // Ordenar por menor carga
      consultantLoads.sort((a, b) => a.load - b.load)

      // Para casos urgentes, retornar o com menor carga
      if (analysis.priority === 'urgent' || analysis.priority === 'high') {
        return consultantLoads[0].consultant
      }

      // Para outros casos, fazer round-robin
      const randomIndex = Math.floor(Math.random() * Math.min(3, consultantLoads.length))
      return consultantLoads[randomIndex].consultant
    } catch (error) {
      console.error('Error finding best consultant:', error)
      return null
    }
  }

  // Analisar conversa completa
  static async analyzeConversation(conversationId: string): Promise<HandoverAnalysis> {
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    })

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const messages = JSON.parse(conversation.messages || '[]')
    const userMessages = messages.filter((m: any) => m.role === 'user')
    const lastMessage = userMessages[userMessages.length - 1]?.content || ''

    // Calcular duração da conversa
    const firstMsg = messages[0]
    const lastMsg = messages[messages.length - 1]
    const duration = firstMsg && lastMsg
      ? (new Date(lastMsg.timestamp).getTime() - new Date(firstMsg.timestamp).getTime()) / 1000
      : 0

    // Contar tentativas da IA
    const aiMessages = messages.filter((m: any) => m.role === 'assistant')

    // Verificar se proposta foi enviada
    const proposalSent = await db.proposal.findFirst({
      where: { leadId: conversation.leadId },
    })

    const context = {
      lead: conversation.lead,
      attempts: aiMessages.length,
      conversationDuration: duration,
      proposalSent: !!proposalSent,
    }

    return this.analyzeMessage(lastMessage, context)
  }
}

// Middleware para verificar handover em cada mensagem
export async function checkHandoverRequired(
  conversationId: string,
  message: string
): Promise<HandoverAnalysis> {
  const analysis = await HandoverEngine.analyzeConversation(conversationId)

  // Se deve fazer handover, executar automaticamente
  if (analysis.shouldHandover) {
    await HandoverEngine.executeHandover(conversationId, analysis)
  }

  return analysis
}
