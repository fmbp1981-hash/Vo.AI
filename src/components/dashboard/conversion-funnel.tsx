"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Target, FileText, CheckCircle } from 'lucide-react'

interface FunnelStage {
  name: string
  count: number
  percentage: number
  color: string
  icon: React.ElementType
}

interface PipelineData {
  [stage: string]: number
}

const stageConfig = {
  'Novo Lead': { color: 'bg-blue-500', icon: Users },
  'Qualificação': { color: 'bg-yellow-500', icon: Target },
  'Proposta': { color: 'bg-orange-500', icon: FileText },
  'Negociação': { color: 'bg-purple-500', icon: Target },
  'Fechado': { color: 'bg-green-500', icon: CheckCircle },
}

export function ConversionFunnel() {
  const [pipelineData, setPipelineData] = useState<PipelineData>({})
  return stages.map((stage, index) => {
    const count = pipelineData[stage] || 0
    const config = stageConfig[stage as keyof typeof stageConfig]

    return {
      name: stage,
      count,
      percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      color: config.color,
      icon: config.icon
    }
  })
}

const getConversionRate = () => {
  const novosLeads = pipelineData['Novo Lead'] || 0
  const fechados = pipelineData['Fechado'] || 0

  return novosLeads > 0 ? Math.round((fechados / novosLeads) * 100) : 0
}

if (loading) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Funil de Conversão</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const funnelStages = getFunnelStages()

return (
  <Card className="col-span-1 lg:col-span-2">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        Funil de Conversão
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {funnelStages.map((stage, index) => (
          <div key={stage.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <stage.icon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {stage.count}
                </Badge>
              </div>
              <span className="text-sm text-gray-500">{stage.percentage}%</span>
            </div>
            <div className="relative">
              <Progress
                value={stage.percentage}
                className="h-8"
                style={{
                  background: `linear-gradient(to right, ${stage.color} ${stage.percentage}%, #f3f4f6 ${stage.percentage}%)`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white mix-blend-difference">
                  {stage.percentage}%
                </span>
              </div>
            </div>
            {index < funnelStages.length - 1 && (
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-gray-300"></div>
              </div>
            )}
          </div>
        ))}

        {/* Taxa de Conversão Geral */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Taxa de Conversão Geral</span>
            <Badge className="bg-green-100 text-green-700">
              {getConversionRate()}%
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pipelineData['Fechado'] || 0} de {pipelineData['Novo Lead'] || 0} leads convertidos
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)
}