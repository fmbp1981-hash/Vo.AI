"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Target, DollarSign, TrendingUp } from 'lucide-react'

interface Consultant {
  id: string
  name: string
  avatar: string
  leads: number
  conversions: number
  revenue: string
  conversionRate: number
  rank: number
}

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 2:
      return 'bg-gray-100 text-gray-700 border-gray-300'
    case 3:
      return 'bg-orange-100 text-orange-700 border-orange-300'
    default:
      return 'bg-blue-50 text-blue-600 border-blue-200'
  }
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return '🥇'
    case 2:
      return '🥈'
    case 3:
      return '🥉'
    default:
      return rank.toString()
  }
}

export function TopConsultants() {
  const [consultants, setConsultants] = React.useState<Consultant[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetchConsultants()
  }, [])

  const fetchConsultants = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard')
      const result = await response.json()

      if (result.success && result.data.topConsultants) {
        const mappedConsultants = result.data.topConsultants.map((item: any, index: number) => ({
          id: item.id,
          name: item.name,
          avatar: item.name.substring(0, 2).toUpperCase(),
          leads: item.leadsCount,
          conversions: item.fechados,
          revenue: `R$ ${(item.fechados * 1500).toLocaleString('pt-BR')}`, // Estimated revenue
          conversionRate: item.conversionRate,
          rank: index + 1
        }))
        setConsultants(mappedConsultants)
      }
    } catch (error) {
      console.error('Error fetching consultants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Consultores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Consultores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {consultants.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Nenhum dado disponível</div>
          ) : (
            consultants.map((consultant) => (
              <div key={consultant.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm">
                    <span className={getRankColor(consultant.rank)}>
                      {getRankIcon(consultant.rank)}
                    </span>
                  </div>

                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {consultant.avatar}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {consultant.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {consultant.leads} leads
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {consultant.conversions} vendas
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {consultant.revenue}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {consultant.conversionRate}%
                    </Badge>
                  </div>
                </div>

                <Progress
                  value={consultant.conversionRate}
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Média da Equipe</span>
            <Badge variant="secondary">
              {consultants.length > 0
                ? Math.round(consultants.reduce((acc, c) => acc + c.conversionRate, 0) / consultants.length)
                : 0}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}