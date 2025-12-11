"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Gift,
    Trophy,
    Calendar,
    Phone,
    Mail,
    ChevronRight,
    Loader2,
    Bell,
    Sparkles
} from 'lucide-react'

interface OpportunityItem {
    id: string
    leadId: string
    leadName: string
    leadPhone?: string
    leadEmail?: string
    type: 'birthday' | 'milestone'
    priority: 'urgent' | 'high' | 'medium' | 'low'
    daysUntil: number
    title: string
    description: string
    icon: string
    actionSuggestion: string
}

const priorityColors = {
    urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const priorityLabels = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
}

export function OpportunitiesWidget() {
    const [loading, setLoading] = useState(true)
    const [birthdays, setBirthdays] = useState<OpportunityItem[]>([])
    const [milestones, setMilestones] = useState<OpportunityItem[]>([])
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => {
        fetchOpportunities()
    }, [])

    const fetchOpportunities = async () => {
        try {
            const response = await fetch('/api/opportunities')
            const data = await response.json()
            setBirthdays(data.birthdays || [])
            setMilestones(data.milestones || [])
        } catch (error) {
            console.error('Error fetching opportunities:', error)
        } finally {
            setLoading(false)
        }
    }

    const allOpportunities = [...birthdays, ...milestones].sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    const urgentCount = allOpportunities.filter(o => o.priority === 'urgent').length
    const highCount = allOpportunities.filter(o => o.priority === 'high').length

    if (loading) {
        return (
            <Card className="bg-card border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-secondary" />
                        <CardTitle className="text-lg">Oportunidades</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {urgentCount > 0 && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {highCount > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                {highCount} alta{highCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="all" className="text-xs">
                            Todas ({allOpportunities.length})
                        </TabsTrigger>
                        <TabsTrigger value="birthdays" className="text-xs">
                            <Gift className="w-3 h-3 mr-1" />
                            Aniversários ({birthdays.length})
                        </TabsTrigger>
                        <TabsTrigger value="milestones" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Marcos ({milestones.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-0">
                        <OpportunitiesList items={allOpportunities.slice(0, 5)} />
                    </TabsContent>

                    <TabsContent value="birthdays" className="mt-0">
                        <OpportunitiesList items={birthdays.slice(0, 5)} />
                    </TabsContent>

                    <TabsContent value="milestones" className="mt-0">
                        <OpportunitiesList items={milestones.slice(0, 5)} />
                    </TabsContent>
                </Tabs>

                {allOpportunities.length > 5 && (
                    <Button variant="ghost" className="w-full mt-2 text-muted-foreground hover:text-foreground">
                        Ver todas as {allOpportunities.length} oportunidades
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                )}

                {allOpportunities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma oportunidade no momento</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function OpportunitiesList({ items }: { items: OpportunityItem[] }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhuma oportunidade nesta categoria
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30"
                >
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{item.title}</span>
                                <Badge variant="outline" className={priorityColors[item.priority]}>
                                    {priorityLabels[item.priority]}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                                {item.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {item.leadPhone && (
                                    <a
                                        href={`https://wa.me/${item.leadPhone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                        <Phone className="w-3 h-3" />
                                        {item.leadPhone}
                                    </a>
                                )}
                                {item.leadEmail && (
                                    <a
                                        href={`mailto:${item.leadEmail}`}
                                        className="flex items-center gap-1 hover:text-primary transition-colors"
                                    >
                                        <Mail className="w-3 h-3" />
                                        {item.leadEmail}
                                    </a>
                                )}
                            </div>
                            <div className="mt-2 text-xs text-secondary/80 italic">
                                💡 {item.actionSuggestion}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

export default OpportunitiesWidget
