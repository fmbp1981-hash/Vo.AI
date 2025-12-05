'use client'

import { useState } from 'react'
import { ConversationList } from '@/components/inbox/conversation-list'
import { WhatsAppChatWidget } from '@/components/chat/whatsapp-chat-widget'
import { useSession } from 'next-auth/react'

export default function InboxPage() {
    const { data: session } = useSession()
    const [selectedLead, setSelectedLead] = useState<{
        id: string
        name: string
        phone: string
    } | null>(null)

    if (!session?.user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-muted-foreground">Por favor, faça login para acessar o inbox</p>
            </div>
        )
    }

    return (
        <div className="h-screen flex">
            {/* Conversation List Sidebar */}
            <div className="w-96 border-r">
                <ConversationList userId={session.user.id || session.user.email || ''} />
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-6">
                {selectedLead ? (
                    <WhatsAppChatWidget
                        leadId={selectedLead.id}
                        leadName={selectedLead.name}
                        leadPhone={selectedLead.phone}
                        userId={session.user.id || session.user.email || ''}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                            <p className="text-lg">Selecione uma conversa para começar</p>
                            <p className="text-sm mt-2">Suas mensagens aparecerão aqui</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
