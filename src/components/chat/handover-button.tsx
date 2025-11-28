"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface HandoverButtonProps {
    conversationId: string
    currentStatus: string
    onHandoverComplete?: () => void
}

export function HandoverButton({ conversationId, currentStatus, onHandoverComplete }: HandoverButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleHandover = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/chat/handover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId })
            })

            if (response.ok) {
                toast.success('Conversa transferida para humano com sucesso!')
                if (onHandoverComplete) onHandoverComplete()
            } else {
                toast.error('Erro ao transferir conversa')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    if (currentStatus === 'waiting_handoff') {
        return (
            <Button
                onClick={handleHandover}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white"
                size="sm"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Assumir Conversa
            </Button>
        )
    }

    if (currentStatus === 'active') {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleHandover}
                disabled={loading}
                title="Transferir para humano manualmente"
            >
                <UserPlus className="w-4 h-4 mr-2" />
                Transferir
            </Button>
        )
    }

    return null
}
