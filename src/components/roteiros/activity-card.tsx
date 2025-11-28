'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Clock,
  DollarSign,
  Trash2,
  GripVertical,
  Edit
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Activity {
  id: string
  title: string
  description?: string
  location?: string
  startTime?: string
  endTime?: string
  duration?: number // minutes
  cost?: number
  category?: 'attraction' | 'restaurant' | 'hotel' | 'transport' | 'activity' | 'other'
  notes?: string
}

interface ActivityCardProps {
  activity: Activity
  onEdit?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
  isDragging?: boolean
  dragHandleProps?: any
}

const categoryColors = {
  attraction: 'bg-blue-100 text-blue-800 border-blue-200',
  restaurant: 'bg-orange-100 text-orange-800 border-orange-200',
  hotel: 'bg-purple-100 text-purple-800 border-purple-200',
  transport: 'bg-gray-100 text-gray-800 border-gray-200',
  activity: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200',
}

const categoryIcons = {
  attraction: '🏛️',
  restaurant: '🍽️',
  hotel: '🏨',
  transport: '🚗',
  activity: '🎯',
  other: '📍',
}

export function ActivityCard({
  activity,
  onEdit,
  onDelete,
  isDragging = false,
  dragHandleProps,
}: ActivityCardProps) {
  const category = activity.category || 'other'
  const colorClass = categoryColors[category]

  return (
    <Card
      className={cn(
        'p-4 hover:shadow-md transition-all duration-200',
        isDragging && 'opacity-50 scale-105 rotate-2',
        'border-l-4'
      )}
      style={{
        borderLeftColor: category === 'attraction' ? '#3b82f6' :
                         category === 'restaurant' ? '#f97316' :
                         category === 'hotel' ? '#a855f7' :
                         category === 'transport' ? '#6b7280' :
                         category === 'activity' ? '#22c55e' : '#64748b'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing mt-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{categoryIcons[category]}</span>
              <h4 className="font-semibold text-base truncate">
                {activity.title}
              </h4>
            </div>
            <Badge variant="outline" className={cn('text-xs', colorClass)}>
              {category}
            </Badge>
          </div>

          {/* Description */}
          {activity.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
            {activity.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{activity.location}</span>
              </div>
            )}

            {activity.startTime && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  {activity.startTime}
                  {activity.endTime && ` - ${activity.endTime}`}
                </span>
              </div>
            )}

            {activity.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{activity.duration}min</span>
              </div>
            )}

            {activity.cost !== undefined && activity.cost > 0 && (
              <div className="flex items-center gap-1 font-medium text-green-600">
                <DollarSign className="h-3 w-3" />
                <span>R$ {activity.cost.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {activity.notes && (
            <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mb-2">
              💡 {activity.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(activity)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(activity.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
