'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Send, Phone, Video, Paperclip, Loader2, Check, CheckCheck } from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { toast } from 'sonner'

interface Message {
    id: string
    from: string
    to: string
    body: string
    timestamp: string
    type: 'text' | 'image' | 'video' | 'audio' | 'document'
    status: 'sent' | 'delivered' | 'read' | 'failed'
    isFromMe: boolean
}

interface WhatsAppChatWidgetProps {
    leadId: string
    leadName: string
    leadPhone: string
    userId: string
}

export function WhatsAppChatWidget({ leadId, leadName, leadPhone, userId }: WhatsAppChatWidgetProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const { isConnected, on } = useSocket(userId, 'consultant')

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    // Listen for WhatsApp messages via Socket.io
    useEffect(() => {
        const unsubscribeMessage = on('whatsapp:message', (message: Message) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.some((m) => m.id === message.id)) return prev
                return [...prev, message]
            })
        })

        const unsubscribeTyping = on('whatsapp:typing', (data: { from: string; isTyping: boolean }) => {
            if (data.from === leadPhone) {
                setIsTyping(data.isTyping)
            }
        })

        const unsubscribeStatus = on('whatsapp:status', (data: { messageId: string; status: Message['status'] }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === data.messageId ? { ...m, status: data.status } : m
                )
            )
        })

        return () => {
            unsubscribeMessage()
            unsubscribeTyping()
            unsubscribeStatus()
        }
    }, [on, leadPhone])

    // Load initial messages
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/whatsapp/messages/${leadId}`)
                if (res.ok) {
                    const data = await res.json()
                    setMessages(data.messages || [])
                }
            } catch (error) {
                console.error('Error fetching messages:', error)
            }
        }

        fetchMessages()
    }, [leadId])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || isSending) return

        setIsSending(true)
        const tempId = `temp_${Date.now()}`

        // Optimistic UI update
        const optimisticMessage: Message = {
            id: tempId,
            from: userId,
            to: leadPhone,
            body: newMessage,
            timestamp: new Date().toISOString(),
            type: 'text',
            status: 'sent',
            isFromMe: true,
        }

        setMessages((prev) => [...prev, optimisticMessage])
        setNewMessage('')

        try {
            const res = await fetch('/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: leadPhone,
                    message: newMessage,
                    leadId,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                // Replace temp message with real one
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === tempId ? { ...m, id: data.messageId || tempId, status: 'delivered' } : m
                    )
                )
            } else {
                throw new Error('Failed to send message')
            }
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error('Erro ao enviar mensagem')
            // Mark as failed
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId ? { ...m, status: 'failed' } : m
                )
            )
        } finally {
            setIsSending(false)
        }
    }

    const getStatusIcon = (status: Message['status']) => {
        switch (status) {
            case 'sent':
                return <Check className="w-3 h-3" />
            case 'delivered':
                return <CheckCheck className="w-3 h-3" />
            case 'read':
                return <CheckCheck className="w-3 h-3 text-blue-500" />
            case 'failed':
                return <span className="text-red-500">!</span>
            default:
                return null
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-green-100 text-green-700">
                                {leadName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{leadName}</CardTitle>
                            <p className="text-xs text-muted-foreground">{leadPhone}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
                            {isConnected ? 'Online' : 'Offline'}
                        </Badge>
                        <Button variant="ghost" size="icon">
                            <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <Video className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg px-4 py-2 ${message.isFromMe
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                        }`}
                                >
                                    <p className="text-sm">{message.body}</p>
                                    <div
                                        className={`flex items-center gap-1 justify-end mt-1 text-xs ${message.isFromMe ? 'text-green-100' : 'text-gray-500'
                                            }`}
                                    >
                                        <span>{formatTime(message.timestamp)}</span>
                                        {message.isFromMe && getStatusIcon(message.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-lg px-4 py-2">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            <div className="border-t p-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Paperclip className="w-5 h-5" />
                    </Button>
                    <Input
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        disabled={isSending}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        size="icon"
                        className="bg-green-500 hover:bg-green-600"
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
