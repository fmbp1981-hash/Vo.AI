import { db } from './db'

export interface LeadScoringFactors {
  budget?: string | null
  responseTime?: number // in minutes from first contact
  messageCount?: number
  channel?: string | null
  isRecurrent?: boolean
  hasCompleteInfo?: boolean
  engagementLevel?: 'low' | 'medium' | 'high'
  tripComplexity?: 'simple' | 'moderate' | 'complex'
  timeToTravel?: number // days until departure
}

export interface ScoringBreakdown {
  budgetScore: number
  responseScore: number
  engagementScore: number
  channelScore: number
  recurrenceScore: number
  completenessScore: number
  urgencyScore: number
  totalScore: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  priority: 'urgent' | 'high' | 'medium' | 'low'
}

/**
 * Calculate comprehensive lead score (0-100)
 * Based on multiple factors weighted by importance
 */
export function calculateLeadScore(factors: LeadScoringFactors): ScoringBreakdown {
  let budgetScore = 0
  let responseScore = 0
  let engagementScore = 0
  let channelScore = 0
  let recurrenceScore = 0
  let completenessScore = 0
  let urgencyScore = 0

  // 1. Budget Score (30%) - Most important factor
  if (factors.budget) {
    const budgetValue = extractBudgetValue(factors.budget)
    if (budgetValue >= 50000) budgetScore = 30      // R$ 50k+
    else if (budgetValue >= 30000) budgetScore = 27 // R$ 30-50k
    else if (budgetValue >= 20000) budgetScore = 24 // R$ 20-30k
    else if (budgetValue >= 10000) budgetScore = 20 // R$ 10-20k
    else if (budgetValue >= 5000) budgetScore = 15  // R$ 5-10k
    else if (budgetValue >= 2000) budgetScore = 10  // R$ 2-5k
    else budgetScore = 5                            // < R$ 2k
  }

  // 2. Response Time (20%) - Speed of engagement
  if (factors.responseTime !== undefined) {
    if (factors.responseTime < 5) responseScore = 20       // < 5 min (hot lead)
    else if (factors.responseTime < 15) responseScore = 18 // 5-15 min
    else if (factors.responseTime < 30) responseScore = 16 // 15-30 min
    else if (factors.responseTime < 60) responseScore = 14 // 30-60 min
    else if (factors.responseTime < 180) responseScore = 10 // 1-3 hours
    else if (factors.responseTime < 1440) responseScore = 6 // Same day
    else responseScore = 3                                  // Next day+
  }

  // 3. Engagement Level (20%) - Interaction quality
  const msgCount = factors.messageCount || 0
  if (factors.engagementLevel === 'high' || msgCount > 20) {
    engagementScore = 20
  } else if (factors.engagementLevel === 'medium' || msgCount > 10) {
    engagementScore = 15
  } else if (factors.engagementLevel === 'low' || msgCount > 5) {
    engagementScore = 10
  } else if (msgCount > 2) {
    engagementScore = 6
  } else {
    engagementScore = 3
  }

  // 4. Channel Quality (15%) - Where they came from
  const channel = factors.channel?.toLowerCase()
  if (channel === 'whatsapp') channelScore = 15      // Best: direct, personal
  else if (channel === 'telefone') channelScore = 13 // Good: direct call
  else if (channel === 'webchat') channelScore = 11  // Good: engaged on site
  else if (channel === 'instagram') channelScore = 9 // Medium: social
  else if (channel === 'email') channelScore = 7     // Lower: less immediate
  else if (channel === 'presencial') channelScore = 15 // Best: in-person
  else channelScore = 5                              // Unknown

  // 5. Recurrence Bonus (10%) - Returning customer
  if (factors.isRecurrent) {
    recurrenceScore = 10
  }

  // 6. Information Completeness (5%) - Profile completeness
  if (factors.hasCompleteInfo) {
    completenessScore = 5
  } else {
    // Partial score based on what we have
    let completeness = 0
    if (factors.budget) completeness++
    if (factors.channel) completeness++
    if (factors.timeToTravel) completeness++
    completenessScore = (completeness / 3) * 5
  }

  // 7. Urgency Score (Extra) - Time sensitivity
  if (factors.timeToTravel) {
    if (factors.timeToTravel <= 7) urgencyScore = 5       // This week (urgent!)
    else if (factors.timeToTravel <= 14) urgencyScore = 4 // Within 2 weeks
    else if (factors.timeToTravel <= 30) urgencyScore = 3 // This month
    else if (factors.timeToTravel <= 60) urgencyScore = 2 // Next month
    else urgencyScore = 1                                 // Future planning
  }

  // Calculate total score
  const totalScore = Math.min(
    Math.round(
      budgetScore +
      responseScore +
      engagementScore +
      channelScore +
      recurrenceScore +
      completenessScore +
      urgencyScore
    ),
    100
  )

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (totalScore >= 90) grade = 'A'
  else if (totalScore >= 75) grade = 'B'
  else if (totalScore >= 60) grade = 'C'
  else if (totalScore >= 45) grade = 'D'
  else grade = 'F'

  // Determine priority
  let priority: 'urgent' | 'high' | 'medium' | 'low'
  if (totalScore >= 80 || urgencyScore >= 4) priority = 'urgent'
  else if (totalScore >= 65) priority = 'high'
  else if (totalScore >= 45) priority = 'medium'
  else priority = 'low'

  return {
    budgetScore,
    responseScore,
    engagementScore,
    channelScore,
    recurrenceScore,
    completenessScore,
    urgencyScore,
    totalScore,
    grade,
    priority,
  }
}

/**
 * Extract numeric value from budget string
 */
function extractBudgetValue(budget: string): number {
  // Remove R$, currency symbols, dots, commas
  const cleaned = budget.replace(/[R$\s.]/g, '').replace(',', '.')
  const value = parseFloat(cleaned)
  return isNaN(value) ? 0 : value
}

/**
 * Calculate score for an existing lead in database
 */
export async function calculateLeadScoreFromDB(leadId: string): Promise<ScoringBreakdown> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: {
      conversations: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!lead) {
    throw new Error('Lead not found')
  }

  // Calculate message count
  let messageCount = 0
  if (lead.conversations.length > 0) {
    for (const conv of lead.conversations) {
      try {
        const messages = JSON.parse(conv.messages || '[]')
        messageCount += messages.length
      } catch {
        // Ignore parse errors
      }
    }
  }

  // Calculate response time (time from creation to first message)
  let responseTime: number | undefined
  if (lead.conversations.length > 0) {
    const firstConv = lead.conversations[0]
    const diffMs = firstConv.createdAt.getTime() - lead.created.getTime()
    responseTime = Math.round(diffMs / 1000 / 60) // minutes
  }

  // Calculate time to travel
  let timeToTravel: number | undefined
  if (lead.dataPartida) {
    const diffMs = lead.dataPartida.getTime() - new Date().getTime()
    timeToTravel = Math.round(diffMs / 1000 / 60 / 60 / 24) // days
  }

  // Determine engagement level
  let engagementLevel: 'low' | 'medium' | 'high' = 'low'
  if (messageCount > 15) engagementLevel = 'high'
  else if (messageCount > 5) engagementLevel = 'medium'

  // Check completeness
  const hasCompleteInfo = !!(
    lead.nome &&
    lead.email &&
    lead.telefone &&
    lead.destino &&
    lead.orcamento &&
    lead.dataPartida
  )

  return calculateLeadScore({
    budget: lead.orcamento,
    responseTime,
    messageCount,
    channel: lead.canal,
    isRecurrent: lead.recorrente,
    hasCompleteInfo,
    engagementLevel,
    timeToTravel,
  })
}

/**
 * Update lead score in database
 */
export async function updateLeadScore(leadId: string): Promise<{
  score: number
  breakdown: ScoringBreakdown
}> {
  const breakdown = await calculateLeadScoreFromDB(leadId)

  await db.lead.update({
    where: { id: leadId },
    data: {
      score: breakdown.totalScore,
      updatedAt: new Date(),
    },
  })

  return {
    score: breakdown.totalScore,
    breakdown,
  }
}

/**
 * Batch update scores for all leads
 */
export async function batchUpdateLeadScores(leadIds?: string[]): Promise<{
  updated: number
  errors: number
}> {
  let leads
  if (leadIds && leadIds.length > 0) {
    leads = await db.lead.findMany({
      where: { id: { in: leadIds } },
    })
  } else {
    leads = await db.lead.findMany({
      where: {
        status: {
          notIn: ['Fechado', 'Cancelado'],
        },
      },
    })
  }

  let updated = 0
  let errors = 0

  for (const lead of leads) {
    try {
      await updateLeadScore(lead.id)
      updated++
    } catch (error) {
      console.error(`Error updating score for lead ${lead.id}:`, error)
      errors++
    }
  }

  return { updated, errors }
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#16a34a' // green-600
  if (score >= 75) return '#22c55e' // green-500
  if (score >= 60) return '#eab308' // yellow-500
  if (score >= 45) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

/**
 * Get score badge variant
 */
export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 75) return 'default' // success color
  if (score >= 60) return 'secondary'
  if (score >= 45) return 'outline'
  return 'destructive'
}
