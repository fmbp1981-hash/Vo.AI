"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardMetrics } from '@/components/dashboard/metrics'
import { ConversionFunnel } from '@/components/dashboard/conversion-funnel'
import { RecentActivities } from '@/components/dashboard/recent-activities'
import { TopConsultants } from '@/components/dashboard/top-consultants'
import { QuickActions } from '@/components/dashboard/quick-actions'

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">Visão geral do desempenho e atividades recentes</p>
            </div>

            {/* KPI Metrics */}
            <DashboardMetrics />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversion Funnel */}
              <ConversionFunnel />
              
              {/* Top Consultants */}
              <TopConsultants />
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <RecentActivities />
              
              {/* Quick Actions */}
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}