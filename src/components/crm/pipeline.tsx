"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal } from 'lucide-react'
import { LeadCard } from './lead-card'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

interface Lead {
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
}

interface PipelineColumnProps {
  title: string
  stage: string
  count: number
  color: string
  leads: Lead[]
  onAddLead?: () => void
}

const initialPipelineData = {
  'Novo Lead': {
    title: 'Novos Leads',
    color: 'border-blue-200 bg-blue-50',
    leads: [
      {
        id: '1',
        nome: 'Maria Santos',
        email: 'maria.santos@email.com',
        telefone: '(11) 98765-4321',
        destino: 'Paris, França',
        dataPartida: '2024-07-15',
        dataRetorno: '2024-07-22',
        orcamento: 'R$ 15.000',
        pessoas: '2 adultos',
        canal: 'WhatsApp',
        ultimaMensagem: 'Tenho interesse em pacote para Paris',
        dataUltimaMensagem: '2024-06-10T14:30:00Z',
        estagio: 'Novo Lead',
        qualificado: false,
        recorrente: false,
        score: 75
      },
      {
        id: '2',
        nome: 'João Pedro',
        email: 'joao.pedro@email.com',
        telefone: '(21) 91234-5678',
        destino: 'Tóquio, Japão',
        dataPartida: '2024-08-10',
        dataRetorno: '2024-08-20',
        orcamento: 'R$ 20.000',
        pessoas: '1 adulto',
        canal: 'Webchat',
        ultimaMensagem: 'Quais pacotes disponíveis para Japão?',
        dataUltimaMensagem: '2024-06-10T10:15:00Z',
        estagio: 'Novo Lead',
        qualificado: false,
        recorrente: false,
        score: 68
      },
      {
        id: '3',
        nome: 'Ana Carolina',
        email: 'ana.carol@email.com',
        telefone: '(31) 99876-5432',
        destino: 'Orlando, EUA',
        dataPartida: '2024-09-05',
        dataRetorno: '2024-09-15',
        orcamento: 'R$ 25.000',
        pessoas: '2 adultos, 2 crianças',
        canal: 'Instagram',
        ultimaMensagem: 'Busco pacotes para Disney com crianças',
        dataUltimaMensagem: '2024-06-09T16:45:00Z',
        estagio: 'Novo Lead',
        qualificado: false,
        recorrente: true,
        score: 82
      }
    ]
  },
  'Qualificação': {
    title: 'Qualificação',
    color: 'border-yellow-200 bg-yellow-50',
    leads: [
      {
        id: '4',
        nome: 'Carlos Silva',
        email: 'carlos.silva@email.com',
        telefone: '(11) 97777-8888',
        destino: 'Maldivas',
        dataPartida: '2024-07-01',
        dataRetorno: '2024-07-10',
        orcamento: 'R$ 30.000',
        pessoas: '2 adultos',
        canal: 'WhatsApp',
        ultimaMensagem: 'Confirmado interesse, agendar reunião',
        dataUltimaMensagem: '2024-06-10T09:30:00Z',
        estagio: 'Qualificação',
        qualificado: true,
        recorrente: false,
        score: 90
      },
      {
        id: '5',
        nome: 'Fernanda Lima',
        email: 'fernanda.lima@email.com',
        telefone: '(13) 96666-7777',
        destino: 'Machu Picchu, Peru',
        dataPartida: '2024-08-15',
        dataRetorno: '2024-08-22',
        orcamento: 'R$ 12.000',
        pessoas: '1 adulto',
        canal: 'Email',
        ultimaMensagem: 'Recebi proposta, analisando detalhes',
        dataUltimaMensagem: '2024-06-09T14:20:00Z',
        estagio: 'Qualificação',
        qualificado: true,
        recorrente: false,
        score: 78
      }
    ]
  },
  'Proposta': {
    title: 'Proposta',
    color: 'border-orange-200 bg-orange-50',
    leads: [
      {
        id: '6',
        nome: 'Roberto Mendes',
        email: 'roberto.mendes@email.com',
        telefone: '(21) 95555-6666',
        destino: 'Quênia',
        dataPartida: '2024-07-20',
        dataRetorno: '2024-07-30',
        orcamento: 'R$ 35.000',
        pessoas: '2 adultos',
        canal: 'WhatsApp',
        ultimaMensagem: 'Proposta recebida, aguardando aprovação',
        dataUltimaMensagem: '2024-06-08T11:00:00Z',
        estagio: 'Proposta',
        qualificado: true,
        recorrente: false,
        score: 95
      }
    ]
  },
  'Negociação': {
    title: 'Negociação',
    color: 'border-purple-200 bg-purple-50',
    leads: [
      {
        id: '7',
        nome: 'Juliana Castro',
        email: 'juliana.castro@email.com',
        telefone: '(51) 94444-5555',
        destino: 'Cancún, México',
        dataPartida: '2024-06-25',
        dataRetorno: '2024-07-02',
        orcamento: 'R$ 18.000',
        pessoas: '2 adultos',
        canal: 'WhatsApp',
        ultimaMensagem: 'Negociando forma de pagamento',
        dataUltimaMensagem: '2024-06-10T15:30:00Z',
        estagio: 'Negociação',
        qualificado: true,
        recorrente: true,
        score: 88
      }
    ]
  },
  'Fechado': {
    title: 'Fechados',
    color: 'border-green-200 bg-green-50',
    leads: [
      {
        id: '8',
        nome: 'Pedro Santos',
        email: 'pedro.santos@email.com',
        telefone: '(41) 93333-4444',
        destino: 'Bariloche, Argentina',
        dataPartida: '2024-06-15',
        dataRetorno: '2024-06-20',
        orcamento: 'R$ 8.000',
        pessoas: '1 adulto',
        canal: 'Manual',
        ultimaMensagem: 'Contrato assinado, pagamento confirmado',
        dataUltimaMensagem: '2024-06-05T10:00:00Z',
        estagio: 'Fechado',
        qualificado: true,
        recorrente: false,
        score: 92
      },
      {
        id: '9',
        nome: 'Luciana Oliveira',
        email: 'luciana.oliveira@email.com',
        telefone: '(19) 92222-3333',
        destino: 'Europa (Múltiplos países)',
        dataPartida: '2024-09-01',
        dataRetorno: '2024-09-15',
        orcamento: 'R$ 45.000',
        pessoas: '2 adultos, 1 criança',
        canal: 'Email',
        ultimaMensagem: 'Pacote fechado com upgrade executivo',
        dataUltimaMensagem: '2024-06-01T16:00:00Z',
        estagio: 'Fechado',
        qualificado: true,
        recorrente: true,
        score: 98
      }
    ]
  },
  'Pós-Venda': {
    title: 'Pós-Venda',
    color: 'border-teal-200 bg-teal-50',
    leads: [
      {
        id: '10',
        nome: 'Marcos Ferreira',
        email: 'marcos.ferreira@email.com',
        telefone: '(11) 91111-2222',
        destino: 'Dubai, EAU',
        dataPartida: '2024-05-20',
        dataRetorno: '2024-05-27',
        orcamento: 'R$ 28.000',
        pessoas: '2 adultos',
        canal: 'WhatsApp',
        ultimaMensagem: 'Viagem concluída, solicitando feedback',
        dataUltimaMensagem: '2024-05-28T14:00:00Z',
        estagio: 'Pós-Venda',
        qualificado: true,
        recorrente: true,
        score: 94
      }
    ]
  }
}

// Droppable column component
function DroppableColumn({ stage, title, count, color, leads, onAddLead }: PipelineColumnProps) {
  return (
    <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
      <Card className={`min-h-[600px] ${color} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {count}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={onAddLead}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence mode="popLayout">
            {leads.map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
              />
            ))}
          </AnimatePresence>
          
          {leads.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 mb-2">Nenhum lead nesta coluna</p>
              <Button variant="outline" size="sm" onClick={onAddLead}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Lead
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SortableContext>
  )
}

// Draggable lead card wrapper
function DraggableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.24 }}
    >
      <LeadCard
        {...lead}
        onCall={() => console.log('Call:', lead.id)}
        onWhatsApp={() => console.log('WhatsApp:', lead.id)}
        onProposal={() => console.log('Proposal:', lead.id)}
        onView={() => console.log('View:', lead.id)}
      />
    </motion.div>
  )
}

export function CRMPipeline() {
  const [pipelineData, setPipelineData] = useState(initialPipelineData)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which stage the card is being dropped into
    let targetStage: string | null = null
    let sourceLead: Lead | null = null
    let sourceStage: string | null = null

    // Find source lead and stage
    Object.entries(pipelineData).forEach(([stage, data]) => {
      const lead = data.leads.find(l => l.id === activeId)
      if (lead) {
        sourceLead = lead
        sourceStage = stage
      }
    })

    // Find target stage (where it's being dropped)
    Object.entries(pipelineData).forEach(([stage, data]) => {
      if (data.leads.some(l => l.id === overId) || stage === overId) {
        targetStage = stage
      }
    })

    if (!sourceLead || !sourceStage || !targetStage) return
    if (sourceStage === targetStage) return // Same column, no change

    // Optimistic UI update
    const newPipelineData = { ...pipelineData }
    
    // Remove from source
    newPipelineData[sourceStage] = {
      ...newPipelineData[sourceStage],
      leads: newPipelineData[sourceStage].leads.filter(l => l.id !== activeId)
    }

    // Add to target
    const updatedLead = { ...sourceLead, estagio: targetStage }
    newPipelineData[targetStage] = {
      ...newPipelineData[targetStage],
      leads: [...newPipelineData[targetStage].leads, updatedLead]
    }

    setPipelineData(newPipelineData)

    // Call API to persist
    try {
      const response = await fetch(`/api/leads/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estagio: targetStage }),
      })

      if (!response.ok) throw new Error('Failed to update lead')

      toast({
        title: 'Lead atualizado',
        description: `${sourceLead.nome} movido para ${newPipelineData[targetStage].title}`,
      })
    } catch (error) {
      // Revert on error
      setPipelineData(pipelineData)
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível mover o lead. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const activeLead = activeId 
    ? Object.values(pipelineData).flatMap(stage => stage.leads).find(l => l.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CRM Pipeline</h1>
            <p className="text-gray-600">Gerencie seus leads no funil de vendas</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto">
          {Object.entries(pipelineData).map(([stage, column]) => (
            <DroppableColumn
              key={stage}
              stage={stage}
              title={column.title}
              count={column.leads.length}
              color={column.color}
              leads={column.leads}
              onAddLead={() => console.log('Add lead to:', stage)}
            />
          ))}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeLead ? (
          <div className="opacity-90 transform rotate-3">
            <LeadCard
              {...activeLead}
              onCall={() => {}}
              onWhatsApp={() => {}}
              onProposal={() => {}}
              onView={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}