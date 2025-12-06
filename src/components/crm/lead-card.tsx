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
  FileText,
  Calendar,
  Star,
  Clock,
  MapPin,
  DollarSign,
  Users,
  Send,
  Eye
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

const canalColors = {
  'WhatsApp': 'bg-green-100 text-green-800 border-green-200',
  'Instagram': 'bg-pink-100 text-pink-800 border-pink-200',
  'Email': 'bg-blue-100 text-blue-800 border-blue-200',
  'Site': 'bg-purple-100 text-purple-800 border-purple-200',
}

const CanalIcon = ({ className }: { className?: string }) => <MessageSquare className={className} />

function formatDate(dateStr?: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function getScoreColor(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
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
  estagio,
  qualificado,
  recorrente,
  score = 0,
  onCall,
  onWhatsApp,
  onProposal,
  onView,
  onEdit
}: LeadCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white group">
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {nome.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-sm leading-tight">{nome}</h3>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {dataUltimaMensagem ? new Date(dataUltimaMensagem).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Novo'}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>Editar Lead</DropdownMenuItem>
              <DropdownMenuItem onClick={onView}>Ver Detalhes</DropdownMenuItem>
              <DropdownMenuItem onClick={onProposal}>Criar Proposta</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Arquivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 mb-3">
          {email && (
            <div className="text-xs text-gray-600 truncate flex items-center gap-1">
              <span className="opacity-70">📧</span> {email}
            </div>
          )}
          {telefone && (
            <div className="text-xs text-gray-600 truncate flex items-center gap-1">
              <Phone className="w-3 h-3 opacity-70" /> {telefone}
            </div>
          )}
        </div>

        {/* Trip Info */}
        <div className="space-y-2 mb-3 bg-gray-50 p-2 rounded-md">
          {destino && (
            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="truncate">{destino}</span>
            </div>
          )}

          {(dataPartida || dataRetorno) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 opacity-70" />
              <span className="text-xs">
                {formatDate(dataPartida)} {dataRetorno ? `→ ${formatDate(dataRetorno)}` : ''}
              </span>
            </div>
          )}

          {orcamento && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 opacity-70" />
              <span>{orcamento}</span>
            </div>
          )}

          {pessoas && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 opacity-70" />
              <span>{pessoas} pessoas</span>
            </div>
          )}
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {canal && (
            <Badge variant="outline" className={`text-xs ${canalColors[canal as keyof typeof canalColors] || 'bg-gray-100'}`}>
              <CanalIcon className="w-3 h-3 mr-1" />
              {canal}
            </Badge>
          )}

          {qualificado && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              ✓ Qualificado
            </Badge>
          )}

          {recorrente && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              ↻ Recorrente
            </Badge>
          )}
        </div>

        {/* Last Interaction */}
        {ultimaMensagem && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-100 rounded text-xs text-gray-600">
            <div className="font-medium mb-1 text-yellow-800">Última mensagem:</div>
            <div className="line-clamp-2 italic">"{ultimaMensagem}"</div>
          </div>
        )}

        {/* Score Bar */}
        {score > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Score</span>
              <span>{score}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getScoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); onCall?.() }}
          >
            <Phone className="w-3 h-3 mr-1" />
            Ligar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-xs hover:bg-green-50 hover:text-green-600"
            onClick={(e) => { e.stopPropagation(); onWhatsApp?.() }}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Whats
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}