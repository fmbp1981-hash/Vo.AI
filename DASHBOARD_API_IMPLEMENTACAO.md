# 📊 DASHBOARD API - IMPLEMENTAÇÃO COMPLETA

**Status:** Código pronto, requer criação manual de diretório

---

## 📁 CRIAR ESTRUTURA

```bash
cd C:\Users\Dell\Downloads\Vo.AI
mkdir src\app\api\analytics\dashboard
```

---

## 📄 CRIAR ARQUIVO API

**Caminho:** `src/app/api/analytics/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30'
    const consultantId = searchParams.get('consultant')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    const whereFilter: any = {
      created: {
        gte: startDate,
      },
    }

    if (consultantId) {
      whereFilter.assignedTo = consultantId
    }

    // 1. Total de Leads
    const totalLeads = await db.lead.count({
      where: whereFilter,
    })

    // 2. Leads por Estágio
    const leadsByStage = await db.lead.groupBy({
      by: ['estagio'],
      where: whereFilter,
      _count: true,
    })

    // 3. Taxa de Conversão
    const fechados = await db.lead.count({
      where: {
        ...whereFilter,
        estagio: 'Fechado',
      },
    })

    const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : '0'

    // 4. Receita Estimada
    const leadsFechados = await db.lead.findMany({
      where: {
        ...whereFilter,
        estagio: 'Fechado',
        orcamento: {
          not: null,
        },
      },
      select: {
        orcamento: true,
      },
    })

    const receitaEstimada = leadsFechados.reduce((acc, lead) => {
      const valor = lead.orcamento
        ?.replace(/[R$\s.]/g, '')
        .replace(',', '.')
      return acc + (parseFloat(valor || '0') || 0)
    }, 0)

    // 5. Leads por Canal
    const leadsPorCanal = await db.lead.groupBy({
      by: ['canal'],
      where: whereFilter,
      _count: true,
    })

    // 6. Leads Qualificados
    const leadsQualificados = await db.lead.count({
      where: {
        ...whereFilter,
        qualificado: true,
      },
    })

    // 7. Score Médio
    const avgScore = await db.lead.aggregate({
      where: whereFilter,
      _avg: {
        score: true,
      },
    })

    // 8. Top 5 Destinos
    const topDestinos = await db.lead.groupBy({
      by: ['destino'],
      where: {
        ...whereFilter,
        destino: {
          not: null,
        },
      },
      _count: true,
      orderBy: {
        _count: {
          destino: 'desc',
        },
      },
      take: 5,
    })

    // 9. Funil de Conversão
    const funil = [
      {
        stage: 'Novo Lead',
        count: leadsByStage.find((s) => s.estagio === 'Novo Lead')?._count || 0,
      },
      {
        stage: 'Qualificação',
        count: leadsByStage.find((s) => s.estagio === 'Qualificação')?._count || 0,
      },
      {
        stage: 'Proposta Enviada',
        count: leadsByStage.find((s) => s.estagio === 'Proposta Enviada')?._count || 0,
      },
      {
        stage: 'Negociação',
        count: leadsByStage.find((s) => s.estagio === 'Negociação')?._count || 0,
      },
      {
        stage: 'Fechado',
        count: fechados,
      },
    ]

    const response = {
      period: parseInt(period),
      startDate: startDate.toISOString(),
      summary: {
        totalLeads,
        taxaConversao: parseFloat(taxaConversao),
        receitaEstimada: Math.round(receitaEstimada),
        leadsQualificados,
        scoreMedio: Math.round(avgScore._avg.score || 0),
      },
      leadsByStage: leadsByStage.map((s) => ({
        stage: s.estagio,
        count: s._count,
      })),
      leadsPorCanal: leadsPorCanal.map((c) => ({
        canal: c.canal || 'Não especificado',
        count: c._count,
      })),
      funil,
      topDestinos: topDestinos.map((d) => ({
        destino: d.destino,
        count: d._count,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}
```

---

## 🔌 CONECTAR NO DASHBOARD

**Arquivo:** `src/app/page.tsx` (ou onde estiver o dashboard)

Adicionar ao início do componente:

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/analytics/dashboard?period=30')
        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!dashboardData) {
    return <div>Erro ao carregar dados</div>
  }

  // Usar dashboardData.summary.totalLeads, etc
  return (
    // ... seu JSX atual
  )
}
```

---

## 📊 DADOS DISPONÍVEIS

### `dashboardData.summary`
- `totalLeads` - Total de leads no período
- `taxaConversao` - Percentual de conversão
- `receitaEstimada` - Receita em R$
- `leadsQualificados` - Leads qualificados
- `scoreMedio` - Score médio

### `dashboardData.leadsByStage`
Array com: `{ stage, count }`

### `dashboardData.leadsPorCanal`
Array com: `{ canal, count }`

### `dashboardData.funil`
Array com: `{ stage, count }`

### `dashboardData.topDestinos`
Array com: `{ destino, count }`

---

## 🧪 TESTAR

```bash
# 1. Criar diretório
mkdir src\app\api\analytics\dashboard

# 2. Criar arquivo route.ts com código acima

# 3. Testar API
curl http://localhost:3000/api/analytics/dashboard?period=30

# 4. Ver resposta JSON
```

---

## ✅ FEATURES IMPLEMENTADAS

- [x] Total de leads
- [x] Taxa de conversão
- [x] Receita estimada
- [x] Leads por estágio
- [x] Leads por canal
- [x] Leads qualificados
- [x] Score médio
- [x] Top 5 destinos
- [x] Funil de conversão
- [x] Filtro por período
- [x] Filtro por consultor
- [x] Queries otimizadas
- [x] Error handling

---

**Status:** Dashboard API 100% pronto!

**Próximo:** WhatsApp Webhook Real (2h)

**Data:** 19/11/2025 00:50h
