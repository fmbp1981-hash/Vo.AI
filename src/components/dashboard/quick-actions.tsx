"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Map,
  FileText,
  MessageSquare,
  Calendar,
} from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ElementType
  action: string
  href: string
  colorClasses: string
}

const quickActions: QuickAction[] = [
  {
    id: 'novo-lead',
    title: 'Novo Lead',
    description: 'Adicionar novo cliente potencial',
    icon: Plus,
    action: 'Criar Lead',
    href: '/crm',
    colorClasses: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30'
  },
  {
    id: 'gerar-roteiro',
    title: 'Gerar Roteiro',
    description: 'Criar roteiro automático com IA',
    icon: Map,
    action: 'Gerar Agora',
    href: '/roteiros',
    colorClasses: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30'
  },
  {
    id: 'nova-proposta',
    title: 'Nova Proposta',
    description: 'Enviar proposta personalizada',
    icon: FileText,
    action: 'Criar Proposta',
    href: '/propostas',
    colorClasses: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 dark:text-amber-400 dark:bg-amber-500/20 dark:hover:bg-amber-500/30'
  },
  {
    id: 'iniciar-chat',
    title: 'Iniciar Chat',
    description: 'Conversar com lead via WhatsApp',
    icon: MessageSquare,
    action: 'Abrir Chat',
    href: '/chat',
    colorClasses: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 border-violet-500/20 dark:text-violet-400 dark:bg-violet-500/20 dark:hover:bg-violet-500/30'
  }
]

export function QuickActions() {
  const router = useRouter()

  const handleAction = (href: string) => {
    router.push(href)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-2 whitespace-normal ${action.colorClasses}`}
                onClick={() => handleAction(action.href)}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center max-w-full break-words">
                  <p className="font-medium text-sm leading-snug line-clamp-2">{action.title}</p>
                  <p className="text-xs opacity-75 mt-1 leading-snug line-clamp-2">{action.description}</p>
                </div>
              </Button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Precisa de ajuda?
            </span>
            <Button variant="link" size="sm" className="text-primary">
              Ver Tutorial
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
