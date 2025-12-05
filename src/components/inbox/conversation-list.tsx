'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Search,
    MessageSquare,
    Instagram,
    Mail,
    Filter,
    MoreVertical
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Conversation {
    id: string
    leadId: string
    leadName: string
    lastMessage: string
    lastMessageTime: string
    unreadCount: number
    channel: 'whatsapp' | 'instagram' | 'webchat' | 'email'
    status: 'active' | 'waiting' | 'closed'
    avatar?: string
}

interface ConversationListProps {
    userId: string
}

export function ConversationList({ userId }: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterChannel, setFilterChannel] = useState<string>('all')
    const [loading, setLoading] = useState(true)
    const { isConnected, on } = useSocket(userId, 'consultant')

    // Fetch conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await fetch('/api/conversations')
                if (res.ok) {
                    const data = await res.json()
                    setConversations(data.conversations || [])
                }
            } catch (error) {
                console.error('Error fetching conversations:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchConversations()
    }, [])

    // Listen for new messages via Socket.io
    useEffect(() => {
        const unsubscribe = on('chat:new_message', (data: any) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.leadId === data.leadId
                        ? {
                            ...conv,
                            lastMessage: data.message,
                            lastMessageTime: data.timestamp,
                            unreadCount: conv.unreadCount + 1,
                        }
                        : conv
                )
            )

            // Sort by most recent
            setConversations((prev) =>
                [...prev].sort(
                    (a, b) =>
                        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
                )
            )
        })

        return unsubscribe
    }, [on])

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'whatsapp':
                return <MessageSquare className="w-4 h-4 text-green-500" />
            case 'instagram':
                return <Instagram className="w-4 h-4 text-pink-500" />
            case 'email':
                return <Mail className="w-4 h-4 text-blue-500" />
            default:
                return <MessageSquare className="w-4 h-4 text-gray-500" />
        }
    }

    const getChannelColor = (channel: string) => {
        switch (channel) {
            case 'whatsapp':
                return 'bg-green-100 text-green-700'
            case 'instagram':
                return 'bg-pink-100 text-pink-700'
            case 'email':
                return 'bg-blue-100 text-blue-700'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (hours < 1) return 'Agora'
        if (hours < 24) return `${hours}h`
        if (days < 7) return `${days}d`
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    }

    const filteredConversations = conversations.filter((conv) => {
        const matchesSearch =
            conv.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesFilter = filterChannel === 'all' || conv.channel === filterChannel

        return matchesSearch && matchesFilter
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <Card className="h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Conversas</h2>
                    <div className="flex items-center gap-2">
                        <Badge variant={isConnected ? 'default' : 'secondary'}>
                            {isConnected ? 'Online' : 'Offline'}
                        </Badge>
                        <Button variant="ghost" size="icon">
                            <Filter className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar conversas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Channel Filters */}
                <div className="flex gap-2 mt-4">
                    <Button
                        variant={filterChannel === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterChannel('all')}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={filterChannel === 'whatsapp' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterChannel('whatsapp')}
                        className="gap-1"
                    >
                        <MessageSquare className="w-3 h-3" />
                        WhatsApp
                    </Button>
                    <Button
                        variant={filterChannel === 'instagram' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterChannel('instagram')}
                        className="gap-1"
                    >
                        <Instagram className="w-3 h-3" />
                        Instagram
                    </Button>
                </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="h-[calc(100%-200px)]">
                <div className="divide-y">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhuma conversa encontrada
                        </div>
                    ) : (
                        filteredConversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                onClick={() => setSelectedConversation(conversation.id)}
                                className={`w-full p-4 hover:bg-accent transition-colors text-left ${selectedConversation === conversation.id ? 'bg-accent' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Avatar className="w-12 h-12">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                                {conversation.leadName
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Channel badge */}
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                            {getChannelIcon(conversation.channel)}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-medium truncate">{conversation.leadName}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                {formatTime(conversation.lastMessageTime)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conversation.lastMessage}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className={`text-xs ${getChannelColor(conversation.channel)}`}>
                                                {conversation.channel}
                                            </Badge>
                                            {conversation.unreadCount > 0 && (
                                                <Badge className="bg-primary text-primary-foreground text-xs">
                                                    {conversation.unreadCount}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    )
}
