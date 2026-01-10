"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal, Loader2 } from 'lucide-react'
import { LeadCard } from './lead-card'
import { LeadFormDialog } from '@/components/lead-form-dialog'
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

interface PipelineStage {
  title: string
  color: string
  headerColor: string
  leads: Lead[]
}

interface PipelineData {
  [key: string]: PipelineStage
}

interface PipelineColumnProps {
  title: string
  stage: string
  count: number
  color: string
  headerColor: string
  leads: Lead[]
  onAddLead?: () => void
  onEditLead?: (lead: Lead) => void
}

// Pipeline configuration - Clean, elegant and professional design
const stageConfig = {
  'Novo Lead': {
    title: 'Novos Leads',
    color: 'border-l-4 border-l-blue-500 bg-card',
    headerColor: 'text-blue-400',
  },
  'Recorrente': {
    title: 'Recorrentes',
    color: 'border-l-4 border-l-teal-500 bg-card',
    headerColor: 'text-teal-400',
  },
  'Qualificação': {
    title: 'Qualificação',
    color: 'border-l-4 border-l-amber-500 bg-card',
    headerColor: 'text-amber-400',
  },
  'Gerar Proposta': {
    title: 'Gerar Proposta',
    color: 'border-l-4 border-l-indigo-500 bg-card',
    headerColor: 'text-indigo-400',
  },
  'Proposta Enviada': {
    title: 'Proposta Enviada',
    color: 'border-l-4 border-l-sky-500 bg-card',
    headerColor: 'text-sky-400',
  },
  'Negociação': {
    title: 'Negociação',
    color: 'border-l-4 border-l-purple-500 bg-card',
    headerColor: 'text-purple-400',
  },
  'Fechado': {
    title: 'Fechados',
    color: 'border-l-4 border-l-emerald-500 bg-card',
    headerColor: 'text-emerald-400',
  },
  'Pós-Venda': {
    title: 'Pós-Venda',
    color: 'border-l-4 border-l-cyan-500 bg-card',
    headerColor: 'text-cyan-400',
  },
  'Cancelado': {
    title: 'Cancelados',
    color: 'border-l-4 border-l-red-500 bg-card',
    headerColor: 'text-red-400',
  },
  'Não Qualificado': {
    title: 'Não Qualificados',
    color: 'border-l-4 border-l-gray-500 bg-card',
    headerColor: 'text-gray-400',
  },
}

// Droppable column component - Clean, elegant design
function DroppableColumn({ stage, title, count, color, headerColor, leads, onAddLead, onEditLead }: PipelineColumnProps) {
  return (
    <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
      <Card className={`min-h-[600px] w-[300px] flex-shrink-0 ${color} border border-border/50 rounded-lg shadow-sm`}>
        <CardHeader className="pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className={`text-sm font-semibold ${headerColor}`}>{title}</CardTitle>
              <Badge variant="outline" className="text-xs font-medium bg-muted/50">
                {count}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-70 hover:opacity-100 transition-opacity"
                onClick={onAddLead}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-70 hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <AnimatePresence mode="popLayout">
            {leads.map((lead) => (
              <DraggableLeadCard
                key={lead.id}
                lead={lead}
                onEdit={() => onEditLead?.(lead)}
              />
            ))}
          </AnimatePresence>

          {leads.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Plus className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">Nenhum lead</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={onAddLead}>
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
function DraggableLeadCard({ lead, onEdit }: { lead: Lead, onEdit?: () => void }) {
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
        onEdit={onEdit}
      />
    </motion.div>
  )
}

export function CRMPipeline() {
  const [pipelineData, setPipelineData] = useState<PipelineData>(() => {
    // Initialize with empty stages
    const initial: PipelineData = {}
    Object.entries(stageConfig).forEach(([stage, config]) => {
      initial[stage] = {
        title: config.title,
        color: config.color,
        headerColor: config.headerColor,
        leads: []
      }
    })
    return initial
  })
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()


  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined)

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/leads')
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED')
      }
      if (!response.ok) throw new Error('Failed to fetch leads')

      const result = await response.json()
      const leads = result.data?.items || []

      // Group leads by stage
      const grouped: PipelineData = {}
      Object.entries(stageConfig).forEach(([stage, config]) => {
        grouped[stage] = {
          title: config.title,
          color: config.color,
          headerColor: config.headerColor,
          leads: leads.filter((l: Lead) => l.estagio === stage)
        }
      })

      setPipelineData(grouped)
    } catch (error) {
      console.error('Error fetching leads:', error)
      if (error instanceof Error && error.message === 'UNAUTHORIZED') {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para continuar.',
          variant: 'destructive',
        })
        return
      }
      toast({
        title: 'Erro ao carregar leads',
        description: 'Não foi possível carregar os leads. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch leads from API
  useEffect(() => {
    fetchLeads()
  }, [])

  const handleNewLead = () => {
    setSelectedLead(undefined)
    setIsDialogOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDialogOpen(true)
  }

  const handleSuccess = () => {
    fetchLeads()
    setIsDialogOpen(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string

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

    // Find target stage - check if dropping on another card or column
    Object.entries(pipelineData).forEach(([stage, data]) => {
      if (data.leads.some(l => l.id === over.id)) {
        targetStage = stage
      }
    })

    // If not found, check if dropping on column directly
    if (!targetStage && Object.keys(stageConfig).includes(over.id as string)) {
      targetStage = over.id as string
    }

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

      const result = await response.json()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando pipeline...</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-2xl font-bold text-foreground">CRM Pipeline</h1>
            <p className="text-muted-foreground">Gerencie seus leads no funil de vendas</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleNewLead}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Pipeline Grid - Clean flex layout */}
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)]">
          {Object.entries(pipelineData).map(([stage, column]) => (
            <DroppableColumn
              key={stage}
              stage={stage}
              title={column.title}
              count={column.leads.length}
              color={column.color}
              headerColor={column.headerColor}
              leads={column.leads}
              onAddLead={handleNewLead}
              onEditLead={handleEditLead}
            />
          ))}
        </div>

        <LeadFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          lead={selectedLead}
          onSuccess={handleSuccess}
        />

        {/* Drag Overlay */}
        <DragOverlay>
          {activeLead ? (
            <div className="opacity-90 transform rotate-3 scale-105">
              <LeadCard
                {...activeLead}
                onCall={() => { }}
                onWhatsApp={() => { }}
                onProposal={() => { }}
                onView={() => { }}
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
