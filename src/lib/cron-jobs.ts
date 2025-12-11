import { db } from './db'
import { AutomationEngine, TRIGGERS } from './automation-engine'
import { sendNotification } from './notifications'
import { BirthdayService } from './birthday-service'

// Verificar leads sem contato e disparar automações
export async function checkInactiveLeads() {
  try {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Leads sem contato há 3 dias
    const leads3Days = await db.lead.findMany({
      where: {
        lastContactAt: {
          lte: threeDaysAgo,
          gte: sevenDaysAgo,
        },
        estagio: {
          notIn: ['Fechado', 'Cancelado', 'Pós-Venda'],
        },
      },
    })

    for (const lead of leads3Days) {
      await AutomationEngine.processEvent(TRIGGERS.NO_CONTACT_3DAYS, { lead })
    }

    // Leads sem contato há 7 dias
    const leads7Days = await db.lead.findMany({
      where: {
        lastContactAt: {
          lte: sevenDaysAgo,
        },
        estagio: {
          notIn: ['Fechado', 'Cancelado', 'Pós-Venda'],
        },
      },
    })

    for (const lead of leads7Days) {
      await AutomationEngine.processEvent(TRIGGERS.NO_CONTACT_7DAYS, { lead })
    }

    console.log(`✅ Checked ${leads3Days.length + leads7Days.length} inactive leads`)
  } catch (error) {
    console.error('Error checking inactive leads:', error)
  }
}

// Verificar tarefas vencidas e enviar lembretes
export async function checkOverdueTasks() {
  try {
    const now = new Date()

    // Marcar tarefas vencidas
    await db.task.updateMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: 'overdue',
      },
    })

    // Buscar tarefas vencidas para notificar
    const overdueTasks = await db.task.findMany({
      where: {
        status: 'overdue',
      },
      include: {
        lead: true,
        user: true,
      },
    })

    for (const task of overdueTasks) {
      await sendNotification({
        userId: task.userId,
        type: 'task',
        title: 'Tarefa vencida',
        message: `${task.title} está vencida desde ${task.dueDate.toLocaleDateString()}`,
        link: `/leads/${task.leadId}`,
      })
    }

    console.log(`✅ Marked ${overdueTasks.length} overdue tasks`)
  } catch (error) {
    console.error('Error checking overdue tasks:', error)
  }
}

// Enviar lembretes de tarefas
export async function sendTaskReminders() {
  try {
    const now = new Date()

    // Buscar tarefas que precisam de lembrete
    const tasksToRemind = await db.task.findMany({
      where: {
        status: 'pending',
        reminderAt: {
          lte: now,
        },
        remindedAt: null,
      },
      include: {
        lead: true,
      },
    })

    for (const task of tasksToRemind) {
      await sendNotification({
        userId: task.userId,
        type: 'task',
        title: 'Lembrete de tarefa',
        message: `${task.title} vence em breve`,
        link: `/leads/${task.leadId}`,
      })

      // Marcar como enviado
      await db.task.update({
        where: { id: task.id },
        data: { remindedAt: now },
      })
    }

    console.log(`✅ Sent ${tasksToRemind.length} task reminders`)
  } catch (error) {
    console.error('Error sending task reminders:', error)
  }
}

// Calcular e atualizar scores dos leads
export async function updateLeadScores() {
  try {
    const leads = await db.lead.findMany({
      where: {
        estagio: {
          notIn: ['Fechado', 'Cancelado'],
        },
      },
      include: {
        conversations: true,
        proposals: true,
        itineraries: true,
      },
    })

    for (const lead of leads) {
      let score = 0

      // Base score por estágio
      const stageScores: Record<string, number> = {
        'Novo Lead': 10,
        Qualificação: 25,
        'Proposta Enviada': 50,
        Negociação: 70,
        Fechado: 100,
      }
      score += stageScores[lead.estagio] || 0

      // Pontos por qualificado
      if (lead.qualificado) score += 15

      // Pontos por orçamento
      if (lead.orcamento) {
        const valor = parseFloat(
          lead.orcamento.replace(/[R$\s.]/g, '').replace(',', '.')
        )
        if (valor > 10000) score += 15
        else if (valor > 5000) score += 10
        else if (valor > 2000) score += 5
      }

      // Pontos por conversas
      score += Math.min(15, lead.conversations.length * 3)

      // Pontos por propostas
      score += Math.min(20, lead.proposals.length * 10)

      // Pontos por roteiros
      score += Math.min(10, lead.itineraries.length * 5)

      // Penalidade por tempo sem contato
      if (lead.lastContactAt) {
        const daysSinceContact = Math.floor(
          (Date.now() - lead.lastContactAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceContact > 7) score -= 20
        else if (daysSinceContact > 3) score -= 10
      }

      // Garantir que está entre 0-100
      score = Math.min(100, Math.max(0, score))

      // Atualizar apenas se mudou
      if (score !== lead.score) {
        await db.lead.update({
          where: { id: lead.id },
          data: { score },
        })
      }
    }

    console.log(`✅ Updated scores for ${leads.length} leads`)
  } catch (error) {
    console.error('Error updating lead scores:', error)
  }
}

// Limpar notificações antigas (mais de 30 dias lidas)
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await db.notification.deleteMany({
      where: {
        isRead: true,
        readAt: {
          lte: thirtyDaysAgo,
        },
      },
    })

    console.log(`✅ Cleaned up ${result.count} old notifications`)
  } catch (error) {
    console.error('Error cleaning up notifications:', error)
  }
}

// Enviar mensagens de aniversário
export async function sendBirthdayMessages() {
  try {
    const result = await BirthdayService.sendBirthdayMessages()
    console.log(`🎂 Sent ${result.sent} birthday messages, ${result.failed} failed`)
  } catch (error) {
    console.error('Error sending birthday messages:', error)
  }
}

// Executar todos os jobs
export async function runScheduledJobs() {
  console.log('🔄 Running scheduled jobs...')

  await Promise.all([
    checkInactiveLeads(),
    checkOverdueTasks(),
    sendTaskReminders(),
    updateLeadScores(),
    cleanupOldNotifications(),
  ])

  console.log('✅ All scheduled jobs completed')
}

// Executar jobs diários (aniversários, etc)
export async function runDailyJobs() {
  console.log('📅 Running daily jobs...')

  await sendBirthdayMessages()

  console.log('✅ Daily jobs completed')
}

// Setup do cron (executar a cada hora)
export function setupCronJobs() {
  // Executar imediatamente
  runScheduledJobs()

  // Executar a cada hora
  setInterval(runScheduledJobs, 60 * 60 * 1000)

  // Lembretes a cada 15 minutos
  setInterval(sendTaskReminders, 15 * 60 * 1000)

  // Jobs diários às 9h (verificar a cada hora se é 9h)
  setInterval(() => {
    const now = new Date()
    if (now.getHours() === 9 && now.getMinutes() < 10) {
      runDailyJobs()
    }
  }, 60 * 60 * 1000)

  console.log('✅ Cron jobs scheduled')
}
