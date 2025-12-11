"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
} from 'lucide-react'

interface LeadCardProps {
  id: string
  nome: string
  email?: string
  telefone?: string
  destino?: string
  dataPartida?: string
  dataRetorno?: string
  orcamento?: string
  pessoas?: string
  canal?: string
  ultimaMensagem?: string
  dataUltimaMensagem?: string
  estagio: string
  qualificado?: boolean
  recorrente?: boolean
  score?: number
  onCall?: () => void
  onWhatsApp?: () => void
  onProposal?: () => void
  onView?: () => void
  onEdit?: () => void
}

// Clean, minimal channel styling
const canalColors: Record<string, string> = {
  'WhatsApp': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Instagram': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'Email': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Site': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-emerald-400'
  if (score >= 50) return 'text-amber-400'
  return 'text-red-400'
}

export function LeadCard({
  nome,
  email,
  telefone,
  destino,
  dataPartida,
  dataRetorno,
  orcamento,
  pessoas,
  canal,
  ultimaMensagem,
  dataUltimaMensagem,
  qualificado,
  recorrente,
  score = 0,
  onCall,
  onWhatsApp,
  onView,
  onEdit
}: LeadCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer bg-card/80 backdrop-blur-sm group border-border/50 hover:border-border">
      <CardContent className="p-4">
        {/* Header - Name and Actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                {nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm text-foreground truncate">{nome}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {dataUltimaMensagem
                    ? new Date(dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : 'Novo'}
                </span>
                {score > 0 && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className={`text-xs font-medium ${getScoreTextColor(score)}`}>{score}%</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={onView}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Trip Info - Clean minimal design */}
        {destino && (
          <div className="mb-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-medium text-foreground truncate">{destino}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {(dataPartida || dataRetorno) && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(dataPartida)}{dataRetorno ? ` → ${formatDate(dataRetorno)}` : ''}</span>
                </div>
              )}
              {pessoas && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{pessoas}</span>
                </div>
              )}
              {orcamento && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{orcamento}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Badges - Minimal style */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {canal && (
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${canalColors[canal] || 'bg-muted/50'}`}>
              {canal}
            </Badge>
          )}
          {qualificado && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Qualificado
            </Badge>
          )}
          {recorrente && (
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium bg-blue-500/10 text-blue-400 border-blue-500/20">
              Recorrente
            </Badge>
          )}
        </div>

        {/* Score Progress Bar - Subtle */}
        {score > 0 && (
          <div className="mb-3">
            <div className="w-full bg-muted/50 rounded-full h-1">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${getScoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions - Clean buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
            onClick={(e) => { e.stopPropagation(); onCall?.() }}
          >
            <Phone className="w-3.5 h-3.5 mr-1.5" />
            Ligar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/5"
            onClick={(e) => { e.stopPropagation(); onWhatsApp?.() }}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}