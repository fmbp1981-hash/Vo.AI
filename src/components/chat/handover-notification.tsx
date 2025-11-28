"use client"

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HandoverNotificationProps {
    reason: string
    score: number
    onAccept: () => void
}

export function HandoverNotification({ reason, score, onAccept }: HandoverNotificationProps) {
    return (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 flex items-center justify-between">
                Solicitação de Atendimento Humano
                <span className="text-xs font-normal bg-amber-200 px-2 py-0.5 rounded-full text-amber-800">
                    Score: {score}
                </span>
            </AlertTitle>
            <AlertDescription className="mt-2">
                <p className="text-amber-700 mb-3">
                    A IA detectou necessidade de intervenção humana.
                    <br />
                    <strong>Motivo:</strong> {reason}
                </p>
                <Button
                    size="sm"
                    onClick={onAccept}
                    className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assumir Agora
                </Button>
            </AlertDescription>
        </Alert>
    )
}
