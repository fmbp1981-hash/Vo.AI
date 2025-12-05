/**
 * Lead Scoring Engine
 * 
 * Calculates lead quality score based on multiple factors:
 * - Budget level
 * - Response time
 * - Number of interactions
 * - Trip dates proximity
 * - Recurrence
 * - Qualification status
 * - Channel quality
 */

interface Lead {
    orcamento?: string
    dataUltimaMensagem?: Date
    qualificado: boolean
    recorrente: boolean
    canal?: string
    dataPartida?: Date
    created: Date
}

interface ScoreBreakdown {
    budget: number
    responsiveness: number
    interactions: number
    dateProximity: number
    recurrence: number
    qualification: number
    channel: number
    total: number
}

/**
 * Extract numeric value from budget string
 */
function parseBudget(budgetString?: string): number {
    if (!budgetString) return 0

    // Remove R$, vírgulas, pontos
    const cleaned = budgetString.replace(/[R$\s.]/g, '').replace(',', '.')
    const value = parseFloat(cleaned)

    return isNaN(value) ? 0 : value
}

/**
 * Calculate budget score (0-20 points)
 */
function calculateBudgetScore(budget?: string): number {
    const value = parseBudget(budget)

    if (value === 0) return 0
    if (value >= 20000) return 20 // High budget
    if (value >= 10000) return 15 // Medium-high
    if (value >= 5000) return 10  // Medium
    if (value >= 2000) return 5   // Low-medium
    return 2 // Very low
}

/**
 * Calculate responsiveness score (0-15 points)
 */
function calculateResponsivenessScore(
    lastMessageDate?: Date,
    createdDate?: Date
): number {
    if (!lastMessageDate || !createdDate) return 0

    const hoursSinceLastMessage =
        (Date.now() - lastMessageDate.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastMessage <= 1) return 15  // Very responsive
    if (hoursSinceLastMessage <= 6) return 12  // Responsive
    if (hoursSinceLastMessage <= 24) return 8  // Moderate
    if (hoursSinceLastMessage <= 72) return 4  // Slow
    return 0 // Inactive
}

/**
 * Calculate date proximity score (0-10 points)
 */
function calculateDateProximityScore(departureDate?: Date): number {
    if (!departureDate) return 0

    const daysUntilDeparture =
        (departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

    if (daysUntilDeparture < 0) return 0           // Past date
    if (daysUntilDeparture <= 30) return 10        // Urgent (1 month)
    if (daysUntilDeparture <= 60) return 8         // Soon (2 months)
    if (daysUntilDeparture <= 90) return 6         // Near (3 months)
    if (daysUntilDeparture <= 180) return 4        // Medium term
    return 2 // Long term
}

/**
 * Calculate channel score (0-10 points)
 */
function calculateChannelScore(channel?: string): number {
    if (!channel) return 5 // Default

    const normalizedChannel = channel.toLowerCase()

    if (normalizedChannel.includes('whatsapp')) return 10  // Best channel
    if (normalizedChannel.includes('instagram')) return 8  // Good channel
    if (normalizedChannel.includes('webchat')) return 7    // Direct
    if (normalizedChannel.includes('email')) return 5      // Standard
    if (normalizedChannel.includes('telefone')) return 6   // Personal
    return 5 // Unknown
}

/**
 * Calculate total lead score (0-100)
 */
export function calculateLeadScore(lead: Lead): ScoreBreakdown {
    const budget = calculateBudgetScore(lead.orcamento)
    const responsiveness = calculateResponsivenessScore(
        lead.dataUltimaMensagem,
        lead.created
    )
    const dateProximity = calculateDateProximityScore(lead.dataPartida)
    const recurrence = lead.recorrente ? 15 : 0
    const qualification = lead.qualificado ? 20 : 0
    const channel = calculateChannelScore(lead.canal)

    // Interactions score (placeholder - would need conversation data)
    const interactions = 0 // TODO: Calculate from conversation history

    const total = Math.min(100,
        budget +
        responsiveness +
        interactions +
        dateProximity +
        recurrence +
        qualification +
        channel
    )

    return {
        budget,
        responsiveness,
        interactions,
        dateProximity,
        recurrence,
        qualification,
        channel,
        total,
    }
}

/**
 * Get score category
 */
export function getScoreCategory(score: number): {
    label: string
    color: string
    priority: 'urgent' | 'high' | 'medium' | 'low'
} {
    if (score >= 80) {
        return {
            label: 'Hot Lead',
            color: 'red',
            priority: 'urgent',
        }
    }

    if (score >= 60) {
        return {
            label: 'Warm Lead',
            color: 'orange',
            priority: 'high',
        }
    }

    if (score >= 40) {
        return {
            label: 'Qualificado',
            color: 'yellow',
            priority: 'medium',
        }
    }

    return {
        label: 'Frio',
        color: 'gray',
        priority: 'low',
    }
}

/**
 * Determine if score needs recalculation
 */
export function shouldRecalculateScore(
    lastUpdated: Date,
    lastMessageDate?: Date
): boolean {
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60)

    // Recalculate every 6 hours
    if (hoursSinceUpdate >= 6) return true

    // Recalculate if new message
    if (lastMessageDate && lastMessageDate > lastUpdated) return true

    return false
}

/**
 * Auto-update lead score
 */
export async function updateLeadScore(leadId: string, leadData: Lead): Promise<number> {
    const scoreBreakdown = calculateLeadScore(leadData)

    // Here you would call API to update the lead
    // For now, just return the score
    return scoreBreakdown.total
}
