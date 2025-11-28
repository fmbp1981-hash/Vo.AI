'use client'

import { useSocket } from '@/hooks/use-socket'
import { useEffect, useState } from 'react'

interface TypingIndicatorProps {
  leadId: string
  currentUserId: string
}

export function TypingIndicator({ leadId, currentUserId }: TypingIndicatorProps) {
  const socket = useSocket()
  const [typingUsers, setTypingUsers] = useState<string[]>([])

  useEffect(() => {
    if (!socket.isConnected) return

    // Listen for typing events
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === currentUserId) return // Ignore own typing

      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId]
        } else {
          return prev.filter((id) => id !== data.userId)
        }
      })
    }

    socket.socket?.on('chat:user_typing', handleTyping)

    return () => {
      socket.socket?.off('chat:user_typing', handleTyping)
    }
  }, [socket, currentUserId])

  if (typingUsers.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2">
      <div className="flex gap-1">
        <span className="animate-bounce delay-0">●</span>
        <span className="animate-bounce delay-100">●</span>
        <span className="animate-bounce delay-200">●</span>
      </div>
      <span>
        {typingUsers.length === 1
          ? 'Alguém está digitando...'
          : `${typingUsers.length} pessoas estão digitando...`}
      </span>
    </div>
  )
}
