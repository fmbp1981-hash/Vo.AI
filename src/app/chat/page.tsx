"use client"

import React from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ChatInterface } from '@/components/chat/chat-interface-connected'

export default function ChatPage() {
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

        {/* Chat Content */}
        <main className="flex-1 overflow-hidden p-6">
          <ChatInterface />
        </main>
      </div>
    </div>
  )
}