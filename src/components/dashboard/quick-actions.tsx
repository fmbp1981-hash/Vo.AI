"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Map, 
  FileText, 
  MessageSquare,
  Phone,
  Calendar,
  Users,
  BarChart3
} from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  icon: React.ElementType
  action: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}

const quickActions: QuickAction[] = [
  {
    title: 'Novo Lead',
    description: 'Adicionar novo cliente potencial',
    icon: Plus,
    action: 'Criar Lead',
    color: 'blue'
  },
  {
    title: 'Gerar Roteiro',
    description: 'Criar roteiro automático com IA',
    icon: Map,
    action: 'Gerar Agora',
    color: 'green'
  },
  {
    title: 'Nova Proposta',
    description: 'Enviar proposta personalizada',
    icon: FileText,
    action: 'Criar Proposta',
    color: 'orange'
  },
  {
    title: 'Iniciar Chat',
    description: 'Conversar com lead via WhatsApp',
    icon: MessageSquare,
    action: 'Abrir Chat',
    color: 'purple'
  }
]

const getColorClasses = (color: QuickAction['color']) => {
  switch (color) {
    case 'blue':
      return 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200'
    case 'green':
      return 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'
    case 'orange':
      return 'bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200'
    case 'purple':
      return 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200'
    case 'red':
      return 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200'
    default:
      return 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
  }
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center gap-2 ${getColorClasses(action.color)}`}
              >
                <Icon className="w-6 h-6" />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs opacity-75 mt-1">{action.description}</p>
                </div>
              </Button>
            )
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Precisa de ajuda? 
            </span>
            <Button variant="link" size="sm" className="text-blue-600">
              Ver Tutorial
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}