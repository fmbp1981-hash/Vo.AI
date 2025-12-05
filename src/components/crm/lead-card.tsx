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
  <DropdownMenuItem className = "text-red-600">Arquivar</DropdownMenuItem >
            </DropdownMenuContent >
          </DropdownMenu >
        </div >

  {/* Contact Info */ }
  < div className = "space-y-1 mb-3" >
    { email && (
      <div className="text-xs text-gray-600 truncate">
        📧 {email}
      </div>
    )}
{
  telefone && (
    <div className="text-xs text-gray-600 truncate">
      📱 {telefone}
    </div>
  )
}
        </div >

  {/* Trip Info */ }
  < div className = "space-y-2 mb-3" >
    { destino && (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4" />
        <span className="truncate">{destino}</span>
      </div>
    )}

{
  (dataPartida || dataRetorno) && (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Calendar className="w-4 h-4" />
      <span className="text-xs">
        {formatDate(dataPartida)} {dataRetorno ? `→ ${formatDate(dataRetorno)}` : ''}
      </span>
    </div>
  )
}

{
  orcamento && (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <DollarSign className="w-4 h-4" />
      <span>{orcamento}</span>
    </div>
  )
}

{
  pessoas && (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Users className="w-4 h-4" />
      <span>{pessoas} pessoas</span>
    </div>
  )
}
        </div >

  {/* Status Badges */ }
  < div className = "flex flex-wrap gap-1 mb-3" >
    { canal && (
      <Badge variant="outline" className={`text-xs ${canalColors[canal as keyof typeof canalColors]}`}>
        <CanalIcon className="w-3 h-3 mr-1" />
        {canal}
      </Badge>
    )}

{
  qualificado && (
    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
      ✓ Qualificado
    </Badge>
  )
}

{
  recorrente && (
    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
      ↻ Recorrente
    </Badge>
  )
}
        </div >

  {/* Last Interaction */ }
{
  ultimaMensagem && (
    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
      <div className="font-medium mb-1">Última mensagem:</div>
      <div className="truncate">{ultimaMensagem}</div>
      {dataUltimaMensagem && (
        <div className="text-gray-400 mt-1">
          {new Date(dataUltimaMensagem).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      )}
    </div>
  )
}

{/* Score Bar */ }
{
  score > 0 && (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
        <span>Score</span>
        <span>{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getScoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

{/* Quick Actions */ }
<div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    className="flex-1"
    onClick={onCall}
  >
    <Phone className="w-3 h-3 mr-1" />
    Ligação
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="flex-1"
    onClick={onWhatsApp}
  >
    <MessageSquare className="w-3 h-3 mr-1" />
    WhatsApp
  </Button>
  <Button
    variant="outline"
    size="sm"
    className="flex-1"
    onClick={onProposal}
  >
    <FileText className="w-3 h-3 mr-1" />
    Proposta
  </Button>
</div>
      </CardContent >
    </Card >
  )
}