"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ItineraryFormProps {
    onSubmit: (data: any) => void
    loading: boolean
}

export function ItineraryForm({ onSubmit, loading }: ItineraryFormProps) {
    const [formData, setFormData] = useState({
        destino: '',
        dataPartida: undefined as Date | undefined,
        dataRetorno: undefined as Date | undefined,
        orcamento: '',
        pessoas: '2',
        perfil: 'lazer',
        preferencias: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Plane className="w-5 h-5" />
                    Novo Roteiro
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="destino">Destino</Label>
                        <Input
                            id="destino"
                            placeholder="Ex: Paris, França"
                            value={formData.destino}
                            onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data de Ida</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dataPartida && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dataPartida ? format(formData.dataPartida, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dataPartida}
                                        onSelect={(date) => setFormData({ ...formData, dataPartida: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Data de Volta</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.dataRetorno && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.dataRetorno ? format(formData.dataRetorno, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.dataRetorno}
                                        onSelect={(date) => setFormData({ ...formData, dataRetorno: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="orcamento">Orçamento Estimado</Label>
                            <Input
                                id="orcamento"
                                placeholder="Ex: R$ 10.000"
                                value={formData.orcamento}
                                onChange={(e) => setFormData({ ...formData, orcamento: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pessoas">Viajantes</Label>
                            <Input
                                id="pessoas"
                                type="number"
                                min="1"
                                value={formData.pessoas}
                                onChange={(e) => setFormData({ ...formData, pessoas: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="perfil">Perfil da Viagem</Label>
                        <Select
                            value={formData.perfil}
                            onValueChange={(value) => setFormData({ ...formData, perfil: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o perfil" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lazer">Lazer / Relaxamento</SelectItem>
                                <SelectItem value="aventura">Aventura / Esportes</SelectItem>
                                <SelectItem value="cultural">Cultural / Histórico</SelectItem>
                                <SelectItem value="gastronomico">Gastronômico</SelectItem>
                                <SelectItem value="familia">Família com Crianças</SelectItem>
                                <SelectItem value="romantico">Romântico / Lua de Mel</SelectItem>
                                <SelectItem value="luxo">Luxo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="preferencias">Preferências Adicionais</Label>
                        <Textarea
                            id="preferencias"
                            placeholder="Ex: Preferimos hotéis boutique, evitar lugares muito cheios, alergias alimentares..."
                            value={formData.preferencias}
                            onChange={(e) => setFormData({ ...formData, preferencias: e.target.value })}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Gerando Roteiro com IA...
                            </>
                        ) : (
                            'Gerar Roteiro'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
