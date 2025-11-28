'use client'

import { useSocket } from '@/hooks/use-socket'
import { Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RealTimeIndicatorProps {
  userId?: string
  role?: string
  showLabel?: boolean
}

export function RealTimeIndicator({
  userId,
  role,
  showLabel = false,
}: RealTimeIndicatorProps) {
  const { isConnected, onlineUsers } = useSocket(userId, role)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={`flex items-center gap-1.5 ${
              isConnected
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {isConnected ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {showLabel && (
              <span className="text-xs">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-semibold">
              {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
            </p>
            {isConnected && (
              <p className="text-muted-foreground mt-1">
                {onlineUsers.size} usuário(s) online
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
