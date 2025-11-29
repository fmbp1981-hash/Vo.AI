"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Sparkles } from 'lucide-react'

export function ItineraryGenerator() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerador de Roteiros</h1>
          <p className="text-gray-600">Crie roteiros personalizados com IA em segundos</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" disabled>
          <Sparkles className="w-4 h-4 mr-2" />
          Gerar Roteiro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            O Gerador de Roteiros está temporariamente desabilitado para correções.
            Use o formulário de roteiros manual por enquanto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}