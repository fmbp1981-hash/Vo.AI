"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  MapPin,
  DollarSign
} from 'lucide-react'

interface Activity {
  id: string
  type: 'message' | 'proposal' | 'call' | 'email' | 'meeting'
  lead: string
  leadAvatar: string
  description: string
  time: string
  priority?: 'low' | 'medium' | 'high'
  consultant: string
  action?: {
    label: string
    onClick: () => void
  }
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'message',
    lead: 'Maria Santos',
    leadAvatar: 'MS',
    description: 'Enviou mensagem sobre roteiro para Europa',
    time: 'Há 2 minutos',
    priority: 'high',
    consultant: 'João Silva'
  },
  {
    id: '2',
    type: 'proposal',
    lead: 'Carlos Silva',
    leadAvatar: 'CS',
    description: 'Visualizou proposta "Caribe 2024"',
    time: 'Há 15 minutos',
    priority: 'medium',
    consultant: 'Ana Costa'
  },
  {
    id: '3',
    type: 'call',
    lead: 'Fernanda Lima',
    leadAvatar: 'FL',
    description: 'Agendou ligação para amanhã às 14h',
    time: 'Há 1 hora',
    priority: 'high',
    consultant: 'Pedro Santos'
  },
  {
    id: '4',
    type: 'email',
    lead: 'Roberto Mendes',
    leadAvatar: 'RM',
    description: 'Recebeu follow-up automático',
    time: 'Há 2 horas',
    priority: 'low',
    consultant: 'Sistema IA'
  },
  {
    id: '5',
    type: 'meeting',
    lead: 'Juliana Castro',
    leadAvatar: 'JC',
    description: 'Reunião de proposta agendada',
    time: 'Há 3 horas',
    priority: 'high',
    consultant: 'Maria Oliveira'
  }
]

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'message':
      return MessageSquare
    case 'proposal':
      return FileText
    case 'call':
      return Phone
    case 'email':
      return Mail
    case 'meeting':
      return Calendar
    default:
      return MessageSquare
  }
}

const getPriorityColor = (priority?: Activity['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    case 'low':
      "use client"

      import React from 'react'
      import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
      import { Badge } from '@/components/ui/badge'
      import { Button } from '@/components/ui/button'
      import { Avatar, AvatarFallback } from '@/components/ui/avatar'
      import {
        MessageSquare,
        FileText,
        Phone,
        Mail,
        Calendar,
        Clock,
        User,
        MapPin,
        DollarSign
      } from 'lucide-react'

      interface Activity {
        id: string
        type: 'message' | 'proposal' | 'call' | 'email' | 'meeting'
        lead: string
        leadAvatar: string
        description: string
        time: string
        priority?: 'low' | 'medium' | 'high'
        consultant: string
        action?: {
          label: string
          onClick: () => void
        }
      }

      const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
          case 'message':
            return MessageSquare
          case 'proposal':
            return FileText
          case 'call':
            return Phone
          case 'email':
            return Mail
          case 'meeting':
            return Calendar
          default:
            return MessageSquare
        }
      }

      const getPriorityColor = (priority?: Activity['priority']) => {
        switch (priority) {
          case 'high':
            return 'bg-red-100 text-red-700 border-red-200'
          case 'medium':
            return 'bg-yellow-100 text-yellow-700 border-yellow-200'
          case 'low':
            return 'bg-green-100 text-green-700 border-green-200'
          default:
            return 'bg-gray-100 text-gray-700 border-gray-200'
        }
      }

      export function RecentActivities() {
        const [activities, setActivities] = React.useState<Activity[]>([])
        const [loading, setLoading] = React.useState(true)

        React.useEffect(() => {
          fetchActivities()
        }, [])

        const fetchActivities = async () => {
          try {
            const response = await fetch('/api/analytics/dashboard')
            const result = await response.json()

            if (result.success && result.data.recentActivities) {
              // Transform API data to component format
              const mappedActivities = result.data.recentActivities.map((item: any) => ({
                id: item.id,
                type: item.acao.includes('mensagem') ? 'message' : 'proposal', // Simplified mapping
                lead: item.nome,
                leadAvatar: item.nome.substring(0, 2).toUpperCase(),
                description: item.acao,
                time: new Date(item.timestamp).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                priority: 'medium', // Default priority
                consultant: 'Sistema' // Default
              }))
              setActivities(mappedActivities)
            }
          } catch (error) {
            console.error('Error fetching activities:', error)
          } finally {
            setLoading(false)
          }
        }

        if (loading) {
          return (
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        }

        return (
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Atividades Recentes
              </CardTitle>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">Nenhuma atividade recente</div>
                ) : (
                  activities.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                            {activity.leadAvatar}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.lead}
                            </p>
                            {activity.priority && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(activity.priority)}`}
                              >
                                {activity.priority === 'high' ? 'Alta' :
                                  activity.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <Icon className="w-4 h-4" />
                            <span>{activity.description}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {activity.consultant}
                            </span>
                          </div>
                        </div>

                        {activity.action && (
                          <Button variant="outline" size="sm" onClick={activity.action.onClick}>
                            {activity.action.label}
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )
      }