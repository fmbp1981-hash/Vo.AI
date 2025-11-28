"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  MapPin,
  Calendar,
  DollarSign,
  title: string
  description: string
  location: string
  type: 'transport' | 'accommodation' | 'meal' | 'sightseeing' | 'shopping' | 'other'
cost ?: number
}

interface ItineraryFormData {
  destination: string
  startDate: string
  endDate: string
  budget: string
  travelers: string
  tripType: string
  preferences: string
  specialRequests: string
}

const tripTypes = [
  { value: 'family', label: 'Família' },
  { value: 'couple', label: 'Casal' },
  { value: 'friends', label: 'Amigos' },
  { value: 'solo', label: 'Individual' },
  { value: 'business', label: 'Negócios' },
  { value: 'adventure', label: 'Aventura' }
]

const activityIcons = {
  transport: Plane,
  accommodation: Hotel,
  meal: Utensils,
  sightseeing: Camera,
  shopping: ShoppingBag,
  other: MapPin
}

const activityColors = {
  transport: 'bg-blue-100 text-blue-700',
  accommodation: 'bg-green-100 text-green-700',
  meal: 'bg-orange-100 text-orange-700',
  sightseeing: 'bg-purple-100 text-purple-700',
  shopping: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700'
}

export function ItineraryGenerator() {
  const [formData, setFormData] = useState<ItineraryFormData>({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '',
    tripType: '',
    preferences: '',
    specialRequests: ''
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedItinerary, setGeneratedItinerary] = useState<ItineraryDay[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)

  const sampleItinerary: ItineraryDay[] = [
    {
      id: '1',
      day: 1,
      date: '2024-06-15',
      title: 'Chegada em Paris',
      activities: [
        {
          id: '1-1',
          time: '10:00',
          title: 'Chegada ao Aeroporto Charles de Gaulle',
          description: 'Recolha de bagagem e transfer para o hotel',
          location: 'Aeroporto CDG',
          type: 'transport',
          cost: 50
        },
        {
          id: '1-2',
          time: '12:00',
          title: 'Check-in no Hotel',
          description: 'Hotel Mercure Paris Centre Tour Eiffel',
          location: 'Paris',
          type: 'accommodation',
          cost: 200
        },
        {
          id: '1-3',
          time: '14:00',
          title: 'Almoço Típico Francês',
          description: 'Restaurante Le Bistro Parisien',
          location: 'Torre Eiffel',
          type: 'meal',
          cost: 40
        },
        {
          id: '1-4',
          time: '16:00',
          title: 'Tour pela Torre Eiffel',
          description: 'Subida ao 2º andar e vistas panorâmicas',
          location: 'Torre Eiffel',
          type: 'sightseeing',
          cost: 30
        }
      ]
    },
    {
      id: '2',
      day: 2,
      date: '2024-06-16',
      title: 'Museus e Cultura',
      activities: [
        {
          id: '2-1',
          time: '09:00',
          title: 'Café da Manhã',
          description: 'Croissants e café no hotel',
          location: 'Hotel',
          type: 'meal',
          cost: 15
        },
        {
          id: '2-2',
          time: '10:00',
          title: 'Museu do Louvre',
          description: 'Visita guiada pelas principais obras',
          location: 'Museu do Louvre',
          type: 'sightseeing',
          cost: 25
        },
        {
          id: '2-3',
          time: '13:00',
          title: 'Almoço no Quartier Latin',
          description: 'Restaurante tradicional francês',
          location: 'Quartier Latin',
          type: 'meal',
          cost: 35
        }
      ]
    }
        return dayTotal + (activity.cost || 0)
}, 0)
    }, 0)
  }

return (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerador de Roteiros</h1>
        <p className="text-gray-600">Crie roteiros personalizados com IA em segundos</p>
      </div>
      <Button
        className="bg-blue-600 hover:bg-blue-700"
        onClick={generateItinerary}
        disabled={isGenerating || !formData.destination || !formData.startDate}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        {isGenerating ? 'Gerando...' : 'Gerar Roteiro'}
      </Button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Informações da Viagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                placeholder="Ex: Paris, França"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Orçamento Total</Label>
              <Input
                id="budget"
                placeholder="Ex: R$ 15.000"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="travelers">Número de Viajantes</Label>
              <Input
                id="travelers"
                placeholder="Ex: 2 adultos, 1 criança"
                value={formData.travelers}
                onChange={(e) => handleInputChange('travelers', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tripType">Tipo de Viagem</Label>
              <Select value={formData.tripType} onValueChange={(value) => handleInputChange('tripType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tripTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="preferences">Preferências</Label>
              <Textarea
                id="preferences"
                placeholder="Ex: Cultura, gastronomia, museus, compras..."
                value={formData.preferences}
                onChange={(e) => handleInputChange('preferences', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="specialRequests">Requisitos Especiais</Label>
              <Textarea
                id="specialRequests"
                placeholder="Ex: Cadeira de rodas, dieta especial, etc..."
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itinerary Preview */}
      <div className="lg:col-span-2">
        {isGenerating && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-medium">Gerando roteiro personalizado...</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                </div>
                <span className="text-sm text-gray-500">{generationProgress}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {generatedItinerary.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Resumo do Roteiro</h3>
                    <p className="text-sm text-gray-600">
                      {formData.destination} • {generatedItinerary.length} dias • {formData.travelers} viajantes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Custo Estimado</p>
                    <p className="text-lg font-bold text-green-600">R$ {getTotalCost().toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Days */}
            {generatedItinerary.map((day) => (
              <Card key={day.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>Dia {day.day}: {day.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{day.date}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {day.activities.map((activity) => {
                      const Icon = activityIcons[activity.type]
                      return (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`p-2 rounded-lg ${activityColors[activity.type]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{activity.time}</span>
                                {activity.cost && (
                                  <Badge variant="secondary">R$ {activity.cost}</Badge>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                    <Button variant="outline">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar por Email
                    </Button>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Criar Proposta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!isGenerating && generatedItinerary.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum roteiro gerado ainda
              </h3>
              <p className="text-gray-600 mb-4">
                Preencha as informações da viagem e clique em "Gerar Roteiro" para criar um roteiro personalizado com IA
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  </div>
)
}