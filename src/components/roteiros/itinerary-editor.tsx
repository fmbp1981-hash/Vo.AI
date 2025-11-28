'use client'

import { useState, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { DayTimeline, DayItinerary } from './day-timeline'
import { Activity, ActivityCard } from './activity-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Download, Share2, CalendarDays, DollarSign } from 'lucide-react'

interface ItineraryEditorProps {
  itinerary: {
    id: string
    title: string
    destination: string
    startDate: Date
    endDate: Date
    days: DayItinerary[]
  }
  onSave?: (itinerary: any) => void
  onExport?: (format: 'pdf' | 'json') => void
  onShare?: () => void
}

export function ItineraryEditor({
  itinerary: initialItinerary,
  onSave,
  onExport,
  onShare,
}: ItineraryEditorProps) {
  const [itinerary, setItinerary] = useState(initialItinerary)
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Calculate totals
  const totals = useMemo(() => {
    const totalActivities = itinerary.days.reduce(
      (sum, day) => sum + day.activities.length,
      0
    )
    const totalCost = itinerary.days.reduce(
      (sum, day) =>
        sum + day.activities.reduce((daySum, activity) => daySum + (activity.cost || 0), 0),
      0
    )
    const totalDays = itinerary.days.length

    return { totalActivities, totalCost, totalDays }
  }, [itinerary.days])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    // Find the activity being dragged
    for (const day of itinerary.days) {
      const activity = day.activities.find((a) => a.id === active.id)
      if (activity) {
        setActiveActivity(activity)
        break
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeDayId = findDayContainingActivity(active.id)
    const overDayId = over.id as string

    if (!activeDayId || activeDayId === overDayId) return

    setItinerary((prev) => {
      const newDays = [...prev.days]

      const activeDayIndex = newDays.findIndex((d) => d.id === activeDayId)
      const overDayIndex = newDays.findIndex((d) => d.id === overDayId)

      const activeDay = newDays[activeDayIndex]
      const overDay = newDays[overDayIndex]

      const activityIndex = activeDay.activities.findIndex((a) => a.id === active.id)
      const [movedActivity] = activeDay.activities.splice(activityIndex, 1)

      overDay.activities.push(movedActivity)

      setHasChanges(true)

      return {
        ...prev,
        days: newDays,
      }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveActivity(null)

    if (!over || active.id === over.id) return

    const dayId = findDayContainingActivity(active.id)
    if (!dayId) return

    setItinerary((prev) => {
      const newDays = [...prev.days]
      const dayIndex = newDays.findIndex((d) => d.id === dayId)
      const day = newDays[dayIndex]

      const oldIndex = day.activities.findIndex((a) => a.id === active.id)
      const newIndex = day.activities.findIndex((a) => a.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        day.activities = arrayMove(day.activities, oldIndex, newIndex)
        setHasChanges(true)
      }

      return {
        ...prev,
        days: newDays,
      }
    })
  }

  const findDayContainingActivity = (activityId: string): string | null => {
    for (const day of itinerary.days) {
      if (day.activities.some((a) => a.id === activityId)) {
        return day.id
      }
    }
    return null
  }

  const handleAddActivity = (dayId: string) => {
    // TODO: Open modal to add new activity
    console.log('Add activity to day:', dayId)
    // For now, add a sample activity
    const newActivity: Activity = {
      id: `activity_${Date.now()}`,
      title: 'Nova Atividade',
      category: 'activity',
      startTime: '09:00',
      endTime: '12:00',
    }

    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? { ...day, activities: [...day.activities, newActivity] }
          : day
      ),
    }))
    setHasChanges(true)
  }

  const handleEditActivity = (activity: Activity) => {
    // TODO: Open modal to edit activity
    console.log('Edit activity:', activity)
  }

  const handleDeleteActivity = (dayId: string, activityId: string) => {
    setItinerary((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.id === dayId
          ? { ...day, activities: day.activities.filter((a) => a.id !== activityId) }
          : day
      ),
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave?.(itinerary)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold">{itinerary.title}</h1>
            <p className="text-lg text-muted-foreground">{itinerary.destination}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {itinerary.startDate.toLocaleDateString('pt-BR')} -{' '}
                  {itinerary.endDate.toLocaleDateString('pt-BR')}
                </span>
              </div>
              <Badge variant="outline">{totals.totalDays} dias</Badge>
              <Badge variant="outline">{totals.totalActivities} atividades</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="secondary" className="mr-2">
                Alterações não salvas
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Duração</div>
              <div className="text-2xl font-bold">{totals.totalDays} dias</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Atividades</div>
              <div className="text-2xl font-bold">{totals.totalActivities}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Custo estimado</div>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                {totals.totalCost.toLocaleString('pt-BR')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Custo médio/dia</div>
              <div className="text-2xl font-bold">
                R$ {Math.round(totals.totalCost / totals.totalDays).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline with Drag & Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {itinerary.days.map((day) => (
            <DayTimeline
              key={day.id}
              day={day}
              onAddActivity={handleAddActivity}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleDeleteActivity}
            />
          ))}
        </div>

        <DragOverlay>
          {activeActivity ? (
            <div className="opacity-50">
              <ActivityCard activity={activeActivity} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Help Text */}
      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground text-center">
          💡 <strong>Dica:</strong> Arraste as atividades para reorganizar ou mover entre dias.
          Clique em "Adicionar" para criar novas atividades.
        </p>
      </Card>
    </div>
  )
}
