'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ActivityCard, Activity } from './activity-card'

interface SortableActivityCardProps {
  activity: Activity
  onEdit?: (activity: Activity) => void
  onDelete?: (activityId: string) => void
}

export function SortableActivityCard({
  activity,
  onEdit,
  onDelete,
}: SortableActivityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ActivityCard
        activity={activity}
        onEdit={onEdit}
        onDelete={onDelete}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
