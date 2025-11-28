'use client'

import { useSocket } from '@/hooks/use-socket'
import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface OnlineUsersProps {
  userId?: string
  role?: string
}

export function OnlineUsers({ userId, role }: OnlineUsersProps) {
  const { onlineUsers } = useSocket(userId, role)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <Users className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {onlineUsers.size}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-xs">
            <p className="font-semibold mb-2">Usuários Online</p>
            {onlineUsers.size === 0 ? (
              <p className="text-muted-foreground">Nenhum usuário online</p>
            ) : (
              <div className="space-y-1">
                {Array.from(onlineUsers).slice(0, 10).map((user) => (
                  <div key={user} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{user}</span>
                  </div>
                ))}
                {onlineUsers.size > 10 && (
                  <p className="text-muted-foreground mt-2">
                    +{onlineUsers.size - 10} mais...
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
