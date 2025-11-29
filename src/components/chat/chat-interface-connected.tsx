"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Phone,
} from 'lucide-react'
import { HandoverButton } from './handover-button'
import { HandoverNotification } from './handover-notification'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  leadId?: string
  conversationId?: string
}

export function ChatInterface({ leadId, conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [handoverAlert, setHandoverAlert] = useState<{
    show: boolean
    reason?: string
  }>({ show: false })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation history
  useEffect(() => {
    if (conversationId) {
      loadConversationHistory()
    }
  }, [conversationId])

  const loadConversationHistory = async () => {
    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`)
      if (!response.ok) throw new Error('Failed to load conversation')

      const result = await response.json()
      if (result.success && result.data.length > 0) {
        const conv = result.data[0]
        const parsedMessages = JSON.parse(conv.messages || '[]')
        setMessages(parsedMessages)
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          leadId,
          conversationId,
          messages: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.data.message,
          timestamp: new Date().toISOString(),
        }

        setMessages(prev => [...prev, assistantMessage])

        // Check for handover
        if (result.data.handover?.should) {
          setHandoverAlert({
            show: true,
            reason: result.data.handover.reason,
          })

          toast({
            title: 'Transferência Solicitada',
            description: 'Um consultor será notificado para atender você.',
          })
        }

        // Show cache indicator
        if (result.data.cached) {
          console.log('✅ Response from cache')
        }
      } else {
        throw new Error(result.error || 'Failed to get response')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)

      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar sua mensagem. Tente novamente.',
        variant: 'destructive',
      })

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, estou com dificuldades no momento. Um consultor entrará em contato em breve! 😊',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleContactConsultant = () => {
    toast({
      title: 'Consultor Notificado',
      description: 'Um de nossos consultores entrará em contato em breve.',
    })
    setHandoverAlert({ show: false })
  }

  return (
    messages.length === 0 && (
      <div className="text-center py-12">
        <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">
          Olá! Sou a Vo.AI 👋
        </h3>
        <p className="text-gray-500 mt-2">
          Como posso ajudar você a planejar sua próxima viagem?
        </p>
      </div>
    )
    }

{
  messages.map((message, index) => (
    <div
      key={index}
      className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''
        }`}
    >
      <div
        className={`rounded-lg px-4 py-2 ${message.role === 'user'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-900'
          }`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
      <span className="text-xs text-gray-500 mt-1">
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </span>
    </div>
  ))
}

{
  loading && (
    <div className="flex items-start gap-3">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-green-100 text-green-600">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-gray-100 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">
            Vo.AI está digitando...
          </span>
        </div>
      </div>
    </div>
  )
}

<div ref={messagesEndRef} />
        </div >
      </CardContent >
    </Card >

  {/* Input Area */ }
  < Card className = "mt-4" >
    <CardContent className="p-4">
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Pressione Enter para enviar • Shift+Enter para nova linha
      </p>
    </CardContent>
    </Card >
  </div >
  )
}
