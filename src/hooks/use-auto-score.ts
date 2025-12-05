/**
 * Hook for automatic lead score updates
 */

import { useEffect } from 'react'

interface UseAutoScoreUpdateOptions {
    leadId: string
    enabled?: boolean
    intervalMinutes?: number
}

/**
 * Automatically update lead score at intervals
 */
export function useAutoScoreUpdate({
    leadId,
    enabled = true,
    intervalMinutes = 360, // 6 hours default
}: UseAutoScoreUpdateOptions) {
    useEffect(() => {
        if (!enabled || !leadId) return

        const updateScore = async () => {
            try {
                const response = await fetch(`/api/leads/${leadId}/score`, {
                    method: 'POST',
                })

                if (!response.ok) {
                    console.error('Failed to update lead score')
                    return
                }

                const data = await response.json()
                console.log(`[Auto Score] Updated lead ${leadId}: ${data.score}`)

                // Trigger a refresh of the lead data
                // This would typically be handled by a global state management solution
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('lead-score-updated', {
                        detail: { leadId, score: data.score }
                    }))
                }
            } catch (error) {
                console.error('[Auto Score] Error updating score:', error)
            }
        }

        // Update score immediately
        updateScore()

        // Set up interval for periodic updates
        const intervalMs = intervalMinutes * 60 * 1000
        const interval = setInterval(updateScore, intervalMs)

        return () => clearInterval(interval)
    }, [leadId, enabled, intervalMinutes])
}

/**
 * Manually trigger score recalculation
 */
export async function recalculateLeadScore(leadId: string): Promise<number | null> {
    try {
        const response = await fetch(`/api/leads/${leadId}/score`, {
            method: 'POST',
        })

        if (!response.ok) {
            throw new Error('Failed to recalculate score')
        }

        const data = await response.json()
        return data.score
    } catch (error) {
        console.error('[Score] Error recalculating:', error)
        return null
    }
}

/**
 * Get score breakdown for a lead
 */
export async function getScoreBreakdown(leadId: string) {
    try {
        const response = await fetch(`/api/leads/${leadId}/score`)

        if (!response.ok) {
            throw new Error('Failed to get score breakdown')
        }

        return await response.json()
    } catch (error) {
        console.error('[Score] Error getting breakdown:', error)
        return null
    }
}
