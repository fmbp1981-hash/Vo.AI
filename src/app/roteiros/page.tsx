"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ItineraryGenerator } from '@/components/roteiros/itinerary-generator'

export default function RoteirosPage() {
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

        {/* Roteiros Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            <ItineraryGenerator />
          </div>
        </main>
      </div>
    </div>
  )
}