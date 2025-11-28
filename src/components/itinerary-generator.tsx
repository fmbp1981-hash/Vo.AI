'use client';

import { useState } from 'react';
import { Calendar, DollarSign, Users, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ItineraryGeneratorProps {
  leadId?: string;
  onGenerated?: (itinerary: any) => void;
}

export function ItineraryGenerator({ leadId, onGenerated }: ItineraryGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null);
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    budget: '',
    travelers: '2',
    travelStyle: 'conforto',
    preferences: '',
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: formData.destination,
          startDate: formData.startDate,
          endDate: formData.endDate,
          budget: parseFloat(formData.budget),
          travelers: parseInt(formData.travelers),
          travelStyle: formData.travelStyle,
          preferences: formData.preferences.split(',').map((p) => p.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar roteiro');
      }

      const itinerary = await response.json();
      setGeneratedItinerary(itinerary);
      
      if (onGenerated) {
        onGenerated(itinerary);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar roteiro. Verifique sua API key da OpenAI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = formData.destination && formData.startDate && formData.endDate && formData.budget;

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gold-400">
            <Sparkles className="h-5 w-5" />
            Gerador de Roteiros IA
          </CardTitle>
          <CardDescription className="text-slate-400">
            Crie roteiros personalizados em menos de 10 segundos usando GPT-4
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-slate-300">Destino</Label>
              <Input
                id="destination"
                placeholder="Ex: Paris, França"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelers" className="text-slate-300">
                <Users className="inline h-4 w-4 mr-1" />
                Viajantes
              </Label>
              <Input
                id="travelers"
                type="number"
                min="1"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-slate-300">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data Início
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-slate-300">
                <Calendar className="inline h-4 w-4 mr-1" />
                Data Fim
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-slate-300">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Orçamento (R$)
              </Label>
              <Input
                id="budget"
                type="number"
                placeholder="15000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="travelStyle" className="text-slate-300">Estilo de Viagem</Label>
              <Select
                value={formData.travelStyle}
                onValueChange={(value) => setFormData({ ...formData, travelStyle: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="economico">Econômico</SelectItem>
                  <SelectItem value="conforto">Conforto</SelectItem>
                  <SelectItem value="luxo">Luxo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="preferences" className="text-slate-300">
                Preferências (separadas por vírgula)
              </Label>
              <Input
                id="preferences"
                placeholder="Cultura, gastronomia, aventura"
                value={formData.preferences}
                onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!isFormValid || isGenerating}
            className="w-full bg-gold-500 hover:bg-gold-600 text-slate-900"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando roteiro...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Roteiro com IA
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedItinerary && (
        <Card className="border-cyan-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-cyan-400">{generatedItinerary.title}</CardTitle>
            <CardDescription className="text-slate-400">{generatedItinerary.summary}</CardDescription>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="border-gold-500 text-gold-400">
                {generatedItinerary.days} dias
              </Badge>
              <Badge variant="outline" className="border-cyan-500 text-cyan-400">
                R$ {generatedItinerary.estimatedCost?.total?.toLocaleString('pt-BR')}
              </Badge>
              {generatedItinerary.metadata && (
                <Badge variant="outline" className="border-slate-600 text-slate-400">
                  Gerado em {generatedItinerary.metadata.generationTime}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Custos Estimados</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Voos</div>
                    <div className="text-slate-100 font-semibold">
                      R$ {generatedItinerary.estimatedCost?.flights?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Hospedagem</div>
                    <div className="text-slate-100 font-semibold">
                      R$ {generatedItinerary.estimatedCost?.accommodation?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Atividades</div>
                    <div className="text-slate-100 font-semibold">
                      R$ {generatedItinerary.estimatedCost?.activities?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Refeições</div>
                    <div className="text-slate-100 font-semibold">
                      R$ {generatedItinerary.estimatedCost?.meals?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-slate-800 p-2 rounded">
                    <div className="text-slate-400">Transporte</div>
                    <div className="text-slate-100 font-semibold">
                      R$ {generatedItinerary.estimatedCost?.transport?.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Roteiro Diário</h4>
                <div className="space-y-3">
                  {generatedItinerary.dailyItinerary?.slice(0, 3).map((day: any) => (
                    <div key={day.day} className="bg-slate-800 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-cyan-400">Dia {day.day}</div>
                          <div className="text-sm text-slate-400">{day.date}</div>
                        </div>
                        <div className="text-sm text-slate-400">
                          R$ {day.totalCost?.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-slate-200 font-medium">{day.title}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {day.activities?.length || 0} atividades planejadas
                      </div>
                    </div>
                  ))}
                  {(generatedItinerary.dailyItinerary?.length || 0) > 3 && (
                    <div className="text-center text-sm text-slate-400">
                      + {generatedItinerary.dailyItinerary.length - 3} dias adicionais
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
