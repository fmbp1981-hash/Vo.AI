"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Save,
    Undo2,
    Redo2,
    Loader2,
    Check,
    AlertCircle,
    Download,
    Send,
} from 'lucide-react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'

interface Activity {
    id: string
    time: string
    title: string
    description: string
    location: string
    type: string
    cost: number
    duration?: string
    tips?: string
}

interface Day {
    id: string
    day: number
    date: string
    title: string
    activities: Activity[]
}

interface ItineraryContent {
    title: string
    summary: string
    days: Day[]
    totalCost: number
}

interface ItineraryVisualEditorProps {
    initialItinerary: ItineraryContent
    itineraryId?: string
    onSave?: (itinerary: ItineraryContent) => Promise<void>
    onClose?: () => void
}

export function ItineraryVisualEditor({
    initialItinerary,
    itineraryId,
    onSave,
    onClose,
}: ItineraryVisualEditorProps) {
    const [itinerary, setItinerary] = useState<ItineraryContent>(initialItinerary)
    const [history, setHistory] = useState<ItineraryContent[]>([initialItinerary])
    const [historyIndex, setHistoryIndex] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [selectedDayIndex, setSelectedDayIndex] = useState(0)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Calculate total cost
    const calculateTotalCost = (days: Day[]) => {
        return days.reduce((total, day) => {
            return total + day.activities.reduce((dayTotal, activity) => {
                return dayTotal + (activity.cost || 0)
            }, 0)
        }, 0)
    }

    // Update history when itinerary changes
    const pushToHistory = (newItinerary: ItineraryContent) => {
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newItinerary)
        // Limit history to 50 items
        if (newHistory.length > 50) {
            newHistory.shift()
        } else {
            setHistoryIndex(historyIndex + 1)
        }
        setHistory(newHistory)
    }

    // Undo
    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1)
            setItinerary(history[historyIndex - 1])
        }
    }

    // Redo
    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1)
            setItinerary(history[historyIndex + 1])
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault()
                undo()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault()
                redo()
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [historyIndex, history])

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const selectedDay = itinerary.days[selectedDayIndex]
            const oldIndex = selectedDay.activities.findIndex((a) => a.id === active.id)
            const newIndex = selectedDay.activities.findIndex((a) => a.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newActivities = arrayMove(selectedDay.activities, oldIndex, newIndex)
                const newDays = [...itinerary.days]
                newDays[selectedDayIndex] = {
                    ...selectedDay,
                    activities: newActivities,
                }

                const newItinerary = {
                    ...itinerary,
                    days: newDays,
                    totalCost: calculateTotalCost(newDays),
                }

                pushToHistory(newItinerary)
                setItinerary(newItinerary)
            }
        }
    }

    // Update activity
    const updateActivity = (activityId: string, updates: Partial<Activity>) => {
        const newDays = itinerary.days.map((day, dayIdx) => {
            if (dayIdx === selectedDayIndex) {
                return {
                    ...day,
                    activities: day.activities.map((activity) =>
                        activity.id === activityId
                            ? { ...activity, ...updates }
                            : activity
                    ),
                }
            }
            return day
        })

        const newItinerary = {
            ...itinerary,
            days: newDays,
            totalCost: calculateTotalCost(newDays),
        }

        pushToHistory(newItinerary)
        setItinerary(newItinerary)
    }

    // Delete activity
    const deleteActivity = (activityId: string) => {
        const newDays = itinerary.days.map((day, dayIdx) => {
            if (dayIdx === selectedDayIndex) {
                return {
                    ...day,
                    activities: day.activities.filter((a) => a.id !== activityId),
                }
            }
            return day
        })

        const newItinerary = {
            ...itinerary,
            days: newDays,
            totalCost: calculateTotalCost(newDays),
        }

        pushToHistory(newItinerary)
        setItinerary(newItinerary)
    }

    // Save itinerary
    const handleSave = async () => {
        setIsSaving(true)
        setSaveStatus('saving')

        try {
            if (onSave) {
                await onSave(itinerary)
            }
            setSaveStatus('saved')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            console.error('Error saving itinerary:', error)
            setSaveStatus('error')
        } finally {
            setIsSaving(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value)
    }

    const selectedDay = itinerary.days[selectedDayIndex]

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={undo}
                                disabled={historyIndex === 0}
                            >
                                <Undo2 className="w-4 h-4 mr-1" />
                                Desfazer
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={redo}
                                disabled={historyIndex === history.length - 1}
                            >
                                <Redo2 className="w-4 h-4 mr-1" />
                                Refazer
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            {saveStatus === 'saved' && (
                                <span className="text-sm text-green-600 flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    Salvo
                                </span>
                            )}
                            {saveStatus === 'error' && (
                                <span className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Erro ao salvar
                                </span>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-1" />
                                )}
                                Salvar
                            </Button>

                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Exportar PDF
                            </Button>

                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Send className="w-4 h-4 mr-1" />
                                Enviar para Cliente
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Editor */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
                {/* Days Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Dias</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {itinerary.days.map((day, idx) => (
                                <Button
                                    key={day.id}
                                    variant={selectedDayIndex === idx ? 'default' : 'outline'}
                                    className="w-full justify-start"
                                    onClick={() => setSelectedDayIndex(idx)}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>Dia {day.day}</span>
                                        <span className="text-xs">
                                            {formatCurrency(
                                                day.activities.reduce((sum, a) => sum + a.cost, 0)
                                            )}
                                        </span>
                                    </div>
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Activities Timeline */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>
                                {selectedDay.title}
                                <span className="ml-2 text-sm text-gray-500 font-normal">
                                    {new Date(selectedDay.date).toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        day: '2-digit',
                                        month: 'long',
                                    })}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-y-auto max-h-[600px]">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={selectedDay.activities.map((a) => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {selectedDay.activities.map((activity) => (
                                        <div key={activity.id} className="mb-3">
                                            {/* Activity card inline - simplified for now */}
                                            <Card className="border-gray-200">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="font-semibold">{activity.title}</div>
                                                            <div className="text-sm text-gray-600">{activity.time}</div>
                                                            <div className="text-sm text-gray-500">{activity.location}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-semibold">{formatCurrency(activity.cost)}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    ))}
                                </SortableContext>
                            </DndContext>

                            {selectedDay.activities.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhuma atividade neste dia
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Cost Calculator */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-lg">Custos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {itinerary.days.map((day) => {
                                    const dayCost = day.activities.reduce((sum, a) => sum + a.cost, 0)
                                    return (
                                        <div key={day.id} className="flex justify-between text-sm">
                                            <span className="text-gray-600">Dia {day.day}</span>
                                            <span className="font-medium">{formatCurrency(dayCost)}</span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-lg">Total</span>
                                    <span className="font-bold text-2xl text-blue-600">
                                        {formatCurrency(itinerary.totalCost)}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
