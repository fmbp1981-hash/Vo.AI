"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { CRMPipeline } from '@/components/crm/pipeline-v2'

export default function CRMPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* CRM Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            <CRMPipeline />
          </div>
        </main>
      </div>
    </div>
  )
}