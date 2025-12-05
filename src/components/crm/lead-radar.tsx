'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    DollarSign,
    TrendingUp,
    MessageSquare,
    FileText,
    Clock,
    Star,
    Target,
    Activity
} from 'lucide-react'

interface LeadData {
    id: string
    nome: string
    email: string
    telefone: string
    destino?: string
    orcamento?: string
    score: number
    scoreBreakdown: {
        engagement: number
        budget: number
        timeline: number
        fit: number
    }
    status: string
    canal: string
    createdAt: string
    lastContact: string
}

interface TimelineEvent {
    id: string
    type: 'message' | 'call' | 'proposal' | 'status_change' | 'note'
    title: string
    description: string
    timestamp: string
    icon: any
    color: string
}

interface LeadRadarProps {
    leadId: string
}

export function LeadRadar({ leadId }: LeadRadarProps) {
    const [lead, setLead] = useState<LeadData | null>(null)
    const [timeline, setTimeline] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLeadData = async () => {
            try {
                const [leadRes, timelineRes] = await Promise.all([
                    fetch(`/api/leads/${leadId}`),
                    fetch(`/api/leads/${leadId}/timeline`)
                ])

                if (leadRes.ok) {
                    const leadData = await leadRes.json()
                    setLead(leadData)
                }

                if (timelineRes.ok) {
                    const timelineData = await timelineRes.json()
                    setTimeline(timelineData.events || [])
                }
            } catch (error) {
                console.error('Error fetching lead data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchLeadData()
    }, [leadId])

    if (loading || !lead) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        )
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 60) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Quente'
        if (score >= 60) return 'Morno'
        return 'Frio'
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <User className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{lead.nome}</h1>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {lead.email}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {lead.telefone}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge className="text-lg px-4 py-2">
                                {lead.status}
                            </Badge>
                            <Badge variant="outline">{lead.canal}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Main Score */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Score Geral
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center">
                            <div className={`text-6xl font-bold ${getScoreColor(lead.score)}`}>
                                {lead.score}
                            </div>
                            <p className="text-lg text-muted-foreground mt-2">
                                {getScoreLabel(lead.score)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Breakdown do Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Engajamento</span>
                                    <span className="font-medium">{lead.scoreBreakdown.engagement}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${lead.scoreBreakdown.engagement}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Orçamento</span>
                                    <span className="font-medium">{lead.scoreBreakdown.budget}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full"
                                        style={{ width: `${lead.scoreBreakdown.budget}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Timeline</span>
                                    <span className="font-medium">{lead.scoreBreakdown.timeline}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-yellow-500 h-2 rounded-full"
                                        style={{ width: `${lead.scoreBreakdown.timeline}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Fit de Perfil</span>
                                    <span className="font-medium">{lead.scoreBreakdown.fit}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full"
                                        style={{ width: `${lead.scoreBreakdown.fit}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Destino</p>
                                <p className="font-medium">{lead.destino || 'Não definido'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Orçamento</p>
                                <p className="font-medium">{lead.orcamento || 'Não informado'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Criado em</p>
                                <p className="font-medium text-sm">{formatDate(lead.createdAt)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-muted-foreground">Último contato</p>
                                <p className="font-medium text-sm">{formatDate(lead.lastContact)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="conversas">Conversas</TabsTrigger>
                    <TabsTrigger value="propostas">Propostas</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Interações</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-4">
                                    {timeline.map((event, index) => (
                                        <div key={event.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${event.color}`}
                                                >
                                                    {event.type === 'message' && <MessageSquare className="w-5 h-5" />}
                                                    {event.type === 'call' && <Phone className="w-5 h-5" />}
                                                    {event.type === 'proposal' && <FileText className="w-5 h-5" />}
                                                    {event.type === 'status_change' && <TrendingUp className="w-5 h-5" />}
                                                    {event.type === 'note' && <Star className="w-5 h-5" />}
                                                </div>
                                                {index < timeline.length - 1 && (
                                                    <div className="w-px h-full bg-gray-200 my-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium">{event.title}</h4>
                                                        <p className="text-sm text-muted-foreground">{event.description}</p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDate(event.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="conversas">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                Histórico de conversas será exibido aqui
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="propostas">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-center text-muted-foreground">
                                Propostas enviadas serão exibidas aqui
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
