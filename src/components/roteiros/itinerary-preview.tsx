"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MapPin, Calendar, DollarSign, Users, Clock, Star } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ItineraryPreviewProps {
    itinerary: any
}

export function ItineraryPreview({ itinerary }: ItineraryPreviewProps) {
    if (!itinerary) return null

    const content = typeof itinerary.content === 'string'
        ? JSON.parse(itinerary.content)
        : itinerary.content

    const { aiGeneratedContent, destination, days } = content

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold mb-2">{itinerary.destination}</h2>
                            <div className="flex flex-wrap gap-4 text-blue-100">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{format(new Date(itinerary.startDate), "d MMM", { locale: ptBR })} - {format(new Date(itinerary.endDate), "d MMM yyyy", { locale: ptBR })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{itinerary.travelers} Viajantes</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>{itinerary.budget}</span>
                                </div>
                            </div>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">
                            {itinerary.tripType}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* AI Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Destaques do Roteiro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="prose prose-sm max-w-none text-gray-600">
                        <p>{aiGeneratedContent?.summary || 'Roteiro personalizado gerado com inteligência artificial.'}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Day by Day */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">Programação Dia a Dia</h3>
                {days?.map((day: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 py-3 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                                        {day.dayNumber}
                                    </span>
                                    {format(new Date(day.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {/* Morning */}
                                {day.activities?.morning && (
                                    <div className="flex gap-4">
                                        <div className="w-20 text-sm font-medium text-gray-500 pt-1">Manhã</div>
                                        <div className="flex-1 pb-4 border-l-2 border-blue-100 pl-4 relative">
                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-100 border-2 border-white" />
                                            <p className="text-gray-800">{day.activities.morning}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Afternoon */}
                                {day.activities?.afternoon && (
                                    <div className="flex gap-4">
                                        <div className="w-20 text-sm font-medium text-gray-500 pt-1">Tarde</div>
                                        <div className="flex-1 pb-4 border-l-2 border-orange-100 pl-4 relative">
                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-orange-100 border-2 border-white" />
                                            <p className="text-gray-800">{day.activities.afternoon}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Evening */}
                                {day.activities?.evening && (
                                    <div className="flex gap-4">
                                        <div className="w-20 text-sm font-medium text-gray-500 pt-1">Noite</div>
                                        <div className="flex-1 border-l-2 border-purple-100 pl-4 relative">
                                            <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-purple-100 border-2 border-white" />
                                            <p className="text-gray-800">{day.activities.evening}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
