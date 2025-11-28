"use client"

import React from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Task {
    id: string
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    status: 'pending' | 'completed' | 'cancelled' | 'overdue'
    dueDate: string
    type: string
    lead: {
        nome: string
    }
}

interface TaskCardProps {
    task: Task
    onComplete: (id: string) => void
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
    const priorityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-yellow-100 text-yellow-700',
        high: 'bg-orange-100 text-orange-700',
        urgent: 'bg-red-100 text-red-700',
    }

    const statusColors = {
        pending: 'text-gray-500',
        completed: 'text-green-500',
        cancelled: 'text-gray-400',
        overdue: 'text-red-500',
    }

    const isOverdue = new Date(task.dueDate) < new Date() && task.status === 'pending'

    return (
        <Card className={`border-l-4 ${isOverdue ? 'border-l-red-500' : 'border-l-blue-500'} hover:shadow-md transition-shadow`}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <Badge variant="secondary" className={priorityColors[task.priority]}>
                                {task.priority}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {task.lead.nome}
                        </p>
                    </div>
                    {task.status === 'pending' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onComplete(task.id)}
                        >
                            <CheckCircle className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pb-2">
                <p className="text-sm text-gray-600">{task.description}</p>
            </CardContent>
            <CardFooter className="pt-2 text-xs text-muted-foreground flex justify-between">
                <div className="flex items-center gap-4">
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {format(new Date(task.dueDate), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                        <AlertCircle className="w-3 h-3" />
                        {task.type.replace('_', ' ')}
                    </span>
                </div>
            </CardFooter>
        </Card>
    )
}
