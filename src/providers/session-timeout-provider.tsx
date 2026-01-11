"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useIdleTimeout } from '@/hooks/use-idle-timeout'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Clock } from 'lucide-react'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
  timeoutMinutes?: number
  warningMinutes?: number
}

export function SessionTimeoutProvider({
  children,
  timeoutMinutes = 30,
  warningMinutes = 5,
}: SessionTimeoutProviderProps) {
  const { data: session, status } = useSession()
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(warningMinutes * 60)

  const { resetTimers } = useIdleTimeout(
    timeoutMinutes,
    warningMinutes,
    () => {
      setShowWarning(true)
      setCountdown(warningMinutes * 60)
    }
  )

  // Countdown quando o aviso está visível
  useEffect(() => {
    if (!showWarning) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showWarning])

  const handleContinue = () => {
    setShowWarning(false)
    resetTimers()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Só mostra para usuários autenticados
  if (status !== 'authenticated') {
    return <>{children}</>
  }

  return (
    <>
      {children}
      
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Sessão Prestes a Expirar
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão irá expirar em <strong>{formatTime(countdown)}</strong> por inatividade.
              <br />
              Clique em &quot;Continuar&quot; para permanecer conectado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleContinue}>
              Continuar Conectado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
