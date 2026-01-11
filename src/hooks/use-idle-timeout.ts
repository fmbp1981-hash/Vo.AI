"use client"

import { useEffect, useCallback, useRef } from 'react'
import { signOut } from 'next-auth/react'

/**
 * Hook para detectar inatividade do usuário e fazer logout automático
 * @param timeoutMinutes - Minutos de inatividade antes do logout (padrão: 30)
 * @param warningMinutes - Minutos antes do logout para mostrar aviso (padrão: 5)
 * @param onWarning - Callback quando o aviso de logout é acionado
 */
export function useIdleTimeout(
  timeoutMinutes: number = 30,
  warningMinutes: number = 5,
  onWarning?: () => void
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningRef = useRef<NodeJS.Timeout | null>(null)
  const isWarningShown = useRef(false)

  const resetTimers = useCallback(() => {
    // Limpa timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    isWarningShown.current = false

    // Timer de aviso (X minutos antes do logout)
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningRef.current = setTimeout(() => {
      isWarningShown.current = true
      onWarning?.()
    }, warningTime)

    // Timer de logout
    const logoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      console.log('Session timeout - logging out due to inactivity')
      signOut({ callbackUrl: '/auth/login?reason=timeout' })
    }, logoutTime)
  }, [timeoutMinutes, warningMinutes, onWarning])

  useEffect(() => {
    // Eventos que indicam atividade do usuário
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'keypress'
    ]

    const handleActivity = () => {
      resetTimers()
    }

    // Adiciona listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Inicia os timers
    resetTimers()

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [resetTimers])

  return {
    resetTimers,
    isWarningShown: isWarningShown.current
  }
}
