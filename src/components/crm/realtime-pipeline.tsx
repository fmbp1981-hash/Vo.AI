// Real-time CRM Pipeline with Socket.io
// Enhanced version with live updates

'use client'

import { useEffect, useState } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { PipelineComponent } from '@/components/crm/pipeline'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface RealtimePipelineProps {
  userId: string
  role: string
}

export function RealtimePipeline({ userId, role }: RealtimePipelineProps) {
  const { isConnected, on, changeLeadStatus } = useSocket(userId, role)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Listen for lead status changes from other users
    const unsubscribe = on('lead:status_changed', (data: {
      leadId: string
      newStatus: string
      movedBy: string
      timestamp: string
    }) => {
      if (data.movedBy !== userId) {
        toast.info('Lead atualizado por outro consultor', {
          description: `Lead movido para ${data.newStatus}`,
        })
        
        // Refresh the pipeline
        setRefreshKey(prev => prev + 1)
      }
    })

    return unsubscribe
  }, [on, userId])

  const handleLeadMove = (leadId: string, newStatus: string) => {
    // Emit socket event for real-time update
    changeLeadStatus(leadId, newStatus)
  }

  return (
    <div className="relative">
      {/* Connection status indicator */}
      <div className="absolute top-4 right-4 z-10">
        <Badge
          variant={isConnected ? 'default' : 'destructive'}
          className="gap-2"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          {isConnected ? 'Tempo Real Ativo' : 'Reconectando...'}
        </Badge>
      </div>

      <PipelineComponent
        key={refreshKey}
        onLeadMove={handleLeadMove}
      />
    </div>
  )
}
