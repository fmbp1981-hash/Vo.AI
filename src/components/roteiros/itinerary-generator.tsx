"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react'
import { ItineraryForm } from './itinerary-form'

interface Activity {
  time: string
  title: string
  description: string
  location: string
  type: string
  cost: number
  duration?: string
  tips?: string
}

interface Day {
  day: number
  date: string
  title: string
  activities: Activity[]
}

interface GeneratedItinerary {
  title: string
  summary: string
  totalCost: number
  days: Day[]
}

export function ItineraryGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null)

  const handleGenerateItinerary = async (formData: any) => {
    setIsGenerating(true)
    setError(null)
    setGeneratedItinerary(null)

    try {
      const response = await fetch('/api/roteiros/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: formData.destino,
          startDate: formData.dataPartida?.toISOString().split('T')[0],
          endDate: formData.dataRetorno?.toISOString().split('T')[0],
          budget: formData.orcamento,
          travelers: formData.pessoas,
          tripType: formData.perfil,
          preferences: formData.preferencias,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao gerar roteiro')
      }

      const result = await response.json()

      if (result.success && result.data) {
        setGeneratedItinerary(result.data)
      } else {
        throw new Error('Resposta inválida do servidor')
      }
    } catch (err: any) {
      console.error('Error generating itinerary:', err)
      setError(err.message || 'Erro ao gerar roteiro. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transport':
        return '🚗'
      case 'accommodation':
        return '🏨'
      case 'meal':
        return '🍽️'
      case 'sightseeing':
        return '🎭'
      case 'shopping':
        return '🛍️'
      default:
        return '📍'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de Roteiros com IA</h1>
          <p className="text-gray-600">Crie roteiros personalizados em segundos usando inteligência artificial</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <ItineraryForm
            onSubmit={handleGenerateItinerary}
            loading={isGenerating}
          />
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-2">
          {isGenerating && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Gerando seu roteiro...
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Nossa IA está criando um roteiro personalizado para você.<br />
                      Isso pode levar alguns segundos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isGenerating && !generatedItinerary && (
            <Card>
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700">
                      Pronto para começar?
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Preencha o formulário ao lado e clique em "Gerar Roteiro"<br />
                      para criar seu itinerário personalizado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedItinerary && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        {generatedItinerary.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{generatedItinerary.summary}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Custo Total Estimado</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(generatedItinerary.totalCost)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Days Timeline */}
              <div className="space-y-4">
                {generatedItinerary.days.map((day) => (
                  <Card key={day.day}>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
                            {day.day}
                          </span>
                          {day.title}
                        </span>
                        <span className="text-sm font-normal text-gray-600">
                          {new Date(day.date).toLocaleDateString('pt-BR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {day.activities.map((activity, idx) => (
                          <div
                            key={idx}
                            className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                          >
                            <div className="flex-shrink-0 text-2xl">
                              {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-500">
                                      {activity.time}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {activity.title}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    {activity.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {activity.location}
                                    </span>
                                    {activity.duration && (
                                      <span>⏱️ {activity.duration}</span>
                                    )}
                                  </div>
                                  {activity.tips && (
                                    <p className="text-xs text-blue-700 mt-2 italic">
                                      💡 {activity.tips}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(activity.cost)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedItinerary(null)}
                      className="flex-1"
                    >
                      Gerar Novo Roteiro
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Salvar e Enviar para Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}