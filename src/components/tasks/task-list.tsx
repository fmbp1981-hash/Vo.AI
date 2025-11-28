"use client"

import React, { useEffect, useState } from 'react'
import { TaskCard } from './task-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

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

export function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('pending')
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchTasks()
    }, [filter])

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filter !== 'all') params.append('status', filter)

            const response = await fetch(`/api/tasks?${params.toString()}`)
            const result = await response.json()

            if (result.success) {
                setTasks(result.data)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async (id: string) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'completed' }),
            })

            if (response.ok) {
                // Remove from list if viewing pending, or update status
                if (filter === 'pending') {
                    setTasks(tasks.filter(t => t.id !== id))
                } else {
                    fetchTasks()
                }
            }
        } catch (error) {
            console.error('Error completing task:', error)
        }
    }

    const filteredTasks = tasks.filter(task =>
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.lead.nome.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar tarefas..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="completed">Concluídas</SelectItem>
                        <SelectItem value="all">Todas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhuma tarefa encontrada.
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredTasks.map(task => (
                        <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                </div>
            )}
        </div>
    )
}
