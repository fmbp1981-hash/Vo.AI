"use client"

import React, { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProposalList } from '@/components/propostas/proposal-list'
import { ProposalEditor } from '@/components/propostas/proposal-editor'

export default function PropostasPage() {
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list')
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)

  const handleNewProposal = () => {
    setSelectedProposalId(null)
    setCurrentView('editor')
  }

  const handleEditProposal = (proposalId: string) => {
    setSelectedProposalId(proposalId)
    setCurrentView('editor')
  }

  const handleBackToList = () => {
    setCurrentView('list')
  }

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

        {/* Propostas Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-full">
            {currentView === 'list' ? (
              <ProposalList 
                onNewProposal={handleNewProposal}
                onEditProposal={handleEditProposal}
              />
            ) : (
              <ProposalEditor 
                proposalId={selectedProposalId}
                onBack={handleBackToList}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}