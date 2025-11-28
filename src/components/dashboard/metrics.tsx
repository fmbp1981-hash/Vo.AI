"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  DollarSign,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Activity
} from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  color?: 'blue' | 'green' | 'orange' | 'purple'
}

function KPICard({ title, value, change, changeLabel, icon: Icon, color = 'blue' }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    orange: 'bg-gold-500/10 text-gold-400 border-gold-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }

  const isPositive = change && change > 0

  return (
    <Card className="hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl ${colorClasses[color]} border`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-3">
            {isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardStats {
  leadsHoje: number
  conversoesMes: number
  receitaEstimada: number
  totalLeads: number
  pipelineData: Record<string, number>
}

export function DashboardMetrics() {
  const [stats, setStats] = useState<DashboardStats>({
    leadsHoje: 0,
    conversoesMes: 0,
    receitaEstimada: 0,
    totalLeads: 0,
    pipelineData: {}
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard')
      const result = await response.json()

      if (result.success) {
        const { metrics } = result.data

        setStats({
          leadsHoje: metrics.novoLeads,
          conversoesMes: metrics.fechados,
          receitaEstimada: metrics.fechados * 5000, // Estimate R$5000 per closed lead
          totalLeads: metrics.totalLeads,
          pipelineData: result.data.pipeline
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="h-3 bg-muted rounded w-20"></div>
              <div className="h-9 bg-muted rounded-xl w-9"></div>
            </CardHeader>
            <CardContent>
              <div className="h-9 bg-muted rounded w-20 mb-3"></div>
              <div className="h-3 bg-muted rounded w-28"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Leads Hoje"
        value={stats.leadsHoje}
        change={12}
        changeLabel="vs ontem"
        icon={Users}
        color="blue"
      />
      <KPICard
        title="Conversões Mês"
        value={stats.conversoesMes}
        change={8}
        changeLabel="vs mês passado"
        icon={Target}
        color="green"
      />
      <KPICard
        title="Receita Estimada"
        value={`R$ ${stats.receitaEstimada.toLocaleString('pt-BR')}`}
        change={15}
        changeLabel="vs mês passado"
        icon={DollarSign}
        color="orange"
      />
      <KPICard
        title="Total Leads"
        value={stats.totalLeads}
        change={5}
        changeLabel="vs mês passado"
        icon={MessageSquare}
        color="purple"
      />
    </div>
  )
}