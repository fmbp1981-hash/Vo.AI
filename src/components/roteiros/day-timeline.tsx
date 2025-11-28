'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Plus, Calendar } from 'lucide-react'
import { SortableActivityCard } from './sortable-activity-card'
import { Activity } from './activity-card'
import { cn } from '@/lib/utils'

export interface DayItinerary {
  id: string
  dayNumber: number
  date: Date
  title?: string
  activities: Activity[]
  totalCost?: number
  notes?: string
}

interface DayTimelineProps {
  day: DayItinerary
  onAddActivity?: (dayId: string) => void
  onEditActivity?: (activity: Activity) => void
  onDeleteActivity?: (dayId: string, activityId: string) => void
  isExpanded?: boolean
  onToggleExpand?: (dayId: string) => void
}

export function DayTimeline({
  day,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  isExpanded = true,
  onToggleExpand,
}: DayTimelineProps) {
  const [expanded, setExpanded] = useState(isExpanded)

  const { setNodeRef, isOver } = useDroppable({
    id: day.id,
  })

  const toggleExpand = () => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    onToggleExpand?.(day.id)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
  }

  const totalCost = day.activities.reduce((sum, activity) => sum + (activity.cost || 0), 0)

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Day Header */}
      <Collapsible open={expanded} onOpenChange={toggleExpand}>
        <CollapsibleTrigger asChild>
          <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {expanded ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold">
                    {day.dayNumber}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {day.title || `Dia ${day.dayNumber}`}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {day.activities.length} atividade{day.activities.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(day.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {totalCost > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Custo estimado</div>
                    <div className="text-lg font-semibold text-green-600">
                      R$ {totalCost.toLocaleString('pt-BR')}
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddActivity?.(day.id)
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>

            {day.notes && !expanded && (
              <div className="mt-2 text-sm text-muted-foreground italic">
                {day.notes}
              </div>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-2">
            {day.notes && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg text-sm">
                <span className="font-medium">Notas:</span> {day.notes}
              </div>
            )}

            {/* Activities List with Drag & Drop */}
            <div
              ref={setNodeRef}
              className={cn(
                'space-y-3 min-h-[100px] rounded-lg border-2 border-dashed p-3 transition-colors',
                isOver ? 'border-primary bg-primary/5' : 'border-transparent',
                day.activities.length === 0 && 'flex items-center justify-center'
              )}
            >
              {day.activities.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm">Arraste atividades aqui ou clique em "Adicionar"</p>
                </div>
              ) : (
                <SortableContext
                  items={day.activities.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {day.activities.map((activity) => (
                    <SortableActivityCard
                      key={activity.id}
                      activity={activity}
                      onEdit={onEditActivity}
                      onDelete={(id) => onDeleteActivity?.(day.id, id)}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
