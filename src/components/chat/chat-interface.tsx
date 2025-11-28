"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Search,
  Filter,
  Phone,
  MessageSquare,
  Mail,
  Instagram,
  Send,
  Paperclip,
  Smile
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'

interface Message {
  id: string
  sender: 'user' | 'bot' | 'human' | 'ai'
  content: string
  timestamp: string
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface Conversation {
  id: string
  leadName: string
  avatar: string
  lastMessage: string
  timestamp: string
  channel: 'whatsapp' | 'instagram' | 'email' | 'phone'
  unread: number
  tags: string[]
  assignedTo?: string
  status: 'online' | 'offline' | 'away'
}

// Dummy data for initial state
const initialConversations: Conversation[] = [
  {
    id: '1',
    leadName: 'João Silva',
    avatar: 'JS',
    lastMessage: 'Quanto custa um pacote para Paris?',
    timestamp: '10:30 AM',
    channel: 'whatsapp',
    unread: 2,
    tags: ['Novo Lead', 'Viagem'],
    assignedTo: 'Ana',
    status: 'online',
  },
  {
    id: '2',
    leadName: 'Maria Souza',
    avatar: 'MS',
    lastMessage: 'Gostaria de mais informações sobre o cruzeiro.',
    timestamp: 'Ontem',
    channel: 'instagram',
    unread: 0,
    tags: ['Follow-up'],
    assignedTo: 'Carlos',
    status: 'offline',
  },
  {
    id: '3',
    leadName: 'Pedro Lima',
    avatar: 'PL',
    lastMessage: 'Recebi a proposta, vou analisar.',
    timestamp: '2 dias atrás',
    channel: 'email',
    unread: 1,
    tags: ['Proposta Enviada'],
    assignedTo: 'Ana',
    status: 'away',
  },
]

const initialMessages: Message[] = [
  {
    id: 'm1',
    sender: 'user',
    content: 'Olá! Gostaria de saber mais sobre os pacotes de viagem.',
    timestamp: '10:00 AM',
    status: 'delivered',
  },
  {
    id: 'm2',
    sender: 'bot',
    content: 'Olá! Para qual destino você está interessado?',
    timestamp: '10:01 AM',
  },
]

const channelIcons = {
  whatsapp: Phone,
  instagram: Instagram,
  email: Mail,
  phone: Phone,
}

const channelColors = {
  whatsapp: 'bg-green-100 text-green-700',
  instagram: 'bg-purple-100 text-purple-700',
  email: 'bg-blue-100 text-blue-700',
  phone: 'bg-gray-100 text-gray-700',
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500',
}

const getStatusIcon = (status?: 'sending' | 'sent' | 'delivered' | 'read') => {
  switch (status) {
    case 'sending':
      return <span className="text-xs">...</span>
    case 'sent':
      return <Send className="w-3 h-3" />
    case 'delivered':
      return <Send className="w-3 h-3 rotate-180" />
    case 'read':
      return <Send className="w-3 h-3 text-blue-500" />
    default:
      return null
  }
}

export function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialConversations[0].id)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [messageInput, setMessageInput] = useState('')

  const { socket, isConnected, joinLeadRoom, leaveLeadRoom, on, off } = useSocket()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedConv = conversations.find((conv) => conv.id === selectedConversation)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedConversation && isConnected) {
      console.log(`Joining room for lead: ${selectedConversation}`)
      joinLeadRoom(selectedConversation)

      const handleNewMessage = (data: any) => {
        console.log('New message received:', data)
        if (data.leadId === selectedConversation) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender: data.sender === 'ai' ? 'bot' : 'user',
              content: data.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read', // Assuming read for now
            },
          ])
        }
      }

      const handleHandover = (data: any) => {
        console.log('Handover request received:', data)
        // Optionally show a notification or update UI
      }

      on('chat:new_message', handleNewMessage)
      on('handover:new_request', handleHandover)

      return () => {
        console.log(`Leaving room for lead: ${selectedConversation}`)
        leaveLeadRoom(selectedConversation)
        off('chat:new_message', handleNewMessage)
        off('handover:new_request', handleHandover)
      }
    }
  }, [selectedConversation, isConnected, joinLeadRoom, leaveLeadRoom, on, off])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return

    // Optimistic update
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'human',
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    }

    setMessages((prev) => [...prev, newMessage])
    setMessageInput('')

    // TODO: Emit event to server to send message via WhatsApp
    // socket.emit('chat:send_message', { leadId: selectedConversation, message: messageInput })
  }

  return (
    <div className="h-full flex">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar conversas..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              Todos
            </Button>
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const ChannelIcon = channelIcons[conversation.channel]
            return (
              <Card
                key={conversation.id}
                className={`mx-2 mb-2 cursor-pointer transition-colors ${selectedConversation === conversation.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
                  }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                          {conversation.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusColors[conversation.status]}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.leadName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {conversation.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${channelColors[conversation.channel]}`}
                        >
                          <ChannelIcon className="w-3 h-3 mr-1" />
                          {conversation.channel}
                        </Badge>
                        {conversation.unread > 0 && (
                          <Badge className="bg-red-500 text-white text-xs">
                            {conversation.unread}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 truncate mb-2">
                        {conversation.lastMessage}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {conversation.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {conversation.assignedTo && (
                          <span className="text-xs text-gray-500">
                            {conversation.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {selectedConv.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-medium text-gray-900">{selectedConv.leadName}</h2>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${channelColors[selectedConv.channel]}`}
                      >
                        {channelIcons[selectedConv.channel] &&
                          React.createElement(channelIcons[selectedConv.channel], { className: "w-3 h-3 mr-1" })
                        }
                        {selectedConv.channel}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {selectedConv.assignedTo}
                      </span>
                      {isConnected ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                          Desconectado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' || message.sender === 'human' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[70%] ${message.sender === 'user' || message.sender === 'human' ? 'flex-row-reverse' : ''}`}>
                        {message.sender !== 'user' && message.sender !== 'human' && (
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-gray-200 text-gray-600">
                              {message.sender === 'bot' ? 'IA' : 'HU'}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`rounded-lg p-3 ${message.sender === 'user' || message.sender === 'human'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                          }`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${message.sender === 'user' || message.sender === 'human' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                            <span>{message.timestamp}</span>
                            {(message.sender === 'user' || message.sender === 'human') && getStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button variant="outline" size="sm">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendMessage}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-600">
                Escolha uma conversa da lista para começar a conversar
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}