'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LeadScoreBadgeProps {
  score: number
  showTrend?: boolean
  previousScore?: number
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  breakdown?: {
    budgetScore: number
    responseScore: number
    engagementScore: number
    channelScore: number
    recurrenceScore: number
    completenessScore: number
    urgencyScore: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    priority: 'urgent' | 'high' | 'medium' | 'low'
  }
}

export function LeadScoreBadge({
  score,
  showTrend = false,
  previousScore,
  size = 'md',
  showBreakdown = false,
  breakdown,
}: LeadScoreBadgeProps) {
  // Determine variant based on score
  const getVariant = () => {
    if (score >= 90) return 'default' // Excellent (A+)
    if (score >= 75) return 'default' // Good (A, B+)
    if (score >= 60) return 'secondary' // Average (B, C+)
    if (score >= 45) return 'outline' // Below Average (C, D)
    return 'destructive' // Poor (F)
  }

  // Determine color
  const getColor = () => {
    if (score >= 90) return 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950'
    if (score >= 75) return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950'
    if (score >= 60) return 'text-yellow-700 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950'
    if (score >= 45) return 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-950'
    return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950'
  }

  // Calculate trend
  const trend = previousScore !== undefined ? score - previousScore : 0
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const badge = (
    <Badge
      variant={getVariant()}
      className={cn(
        getColor(),
        sizeClasses[size],
        'font-semibold tabular-nums',
        showBreakdown && 'cursor-help'
      )}
    >
      <span className="mr-1">⭐</span>
      {score}
      {showTrend && trend !== 0 && (
        <TrendIcon
          className={cn(
            'ml-1 inline-block',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5',
            trend > 0 ? 'text-green-600' : 'text-red-600'
          )}
        />
      )}
    </Badge>
  )

  if (showBreakdown && breakdown) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-semibold">Score Breakdown</span>
                <Badge variant={getVariant()} className={cn('ml-2', getColor())}>
                  Grade {breakdown.grade}
                </Badge>
              </div>

              <div className="space-y-1 text-xs">
                <ScoreItem label="Orçamento" score={breakdown.budgetScore} max={30} />
                <ScoreItem label="Tempo de Resposta" score={breakdown.responseScore} max={20} />
                <ScoreItem label="Engajamento" score={breakdown.engagementScore} max={20} />
                <ScoreItem label="Canal" score={breakdown.channelScore} max={15} />
                <ScoreItem label="Recorrência" score={breakdown.recurrenceScore} max={10} />
                <ScoreItem label="Completude" score={breakdown.completenessScore} max={5} />
                <ScoreItem label="Urgência" score={breakdown.urgencyScore} max={5} />
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Prioridade:</span>
                  <Badge
                    variant={
                      breakdown.priority === 'urgent' || breakdown.priority === 'high'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className="ml-2"
                  >
                    {breakdown.priority === 'urgent' && '🔥 Urgente'}
                    {breakdown.priority === 'high' && '⚡ Alta'}
                    {breakdown.priority === 'medium' && '📌 Média'}
                    {breakdown.priority === 'low' && '📭 Baixa'}
                  </Badge>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}

function ScoreItem({ label, score, max }: { label: string; score: number; max: number }) {
  const percentage = (score / max) * 100

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground flex-1">{label}:</span>
      <div className="flex items-center gap-2 flex-1">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all',
              percentage >= 80 ? 'bg-green-500' :
              percentage >= 60 ? 'bg-yellow-500' :
              percentage >= 40 ? 'bg-orange-500' :
              'bg-red-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="font-medium tabular-nums min-w-[3rem] text-right">
          {score}/{max}
        </span>
      </div>
    </div>
  )
}
