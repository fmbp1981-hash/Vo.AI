"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { TaskList } from '@/components/tasks/task-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TasksPage() {
    return (
        <div className="flex h-screen bg-background">
            <aside className="w-64 flex-shrink-0 border-r border-border">
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-bold tracking-tight">Tarefas</h1>
                                <p className="text-muted-foreground">
                                    Gerencie seus follow-ups e atividades pendentes
                                </p>
                            </div>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Nova Tarefa
                            </Button>
                        </div>

                        <TaskList />
                    </div>
                </main>
            </div>
        </div>
    )
}
