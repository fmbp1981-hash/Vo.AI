"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Download,
  Send,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail
} from 'lucide-react'

interface Proposal {
  id: string
  title: string
  leadName: string
  leadEmail?: string
  destination: string
  totalAmount: number
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected'
  createdAt: string
  sentAt?: string
  viewedAt?: string
  signedAt?: string
  pdfUrl?: string
}

const statusConfig = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gray-100 text-gray-700',
    icon: Edit
  },
  sent: {
    label: 'Enviada',
    color: 'bg-blue-100 text-blue-700',
    icon: Send
  },
  viewed: {
    label: 'Visualizada',
    color: 'bg-yellow-100 text-yellow-700',
    icon: Eye
  },
  signed: {
    label: 'Assinada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejeitada',
    color: 'bg-red-100 text-red-700',
    icon: AlertCircle
  }
}

const sampleProposals: Proposal[] = [
  {
    id: '1',
    title: 'Pacote Romântico Paris 2024',
    leadName: 'Maria Santos',
    leadEmail: 'maria.santos@email.com',
    destination: 'Paris, França',
    totalAmount: 12967.50,
    status: 'sent',
    createdAt: '2024-06-10T10:00:00Z',
    sentAt: '2024-06-10T11:30:00Z',
    viewedAt: '2024-06-10T14:20:00Z'
  },
  {
    id: '2',
    title: 'Aventura em Tóquio',
    leadName: 'João Pedro',
    leadEmail: 'joao.pedro@email.com',
    destination: 'Tóquio, Japão',
    totalAmount: 18500.00,
    status: 'draft',
    createdAt: '2024-06-09T15:30:00Z'
  },
  {
    id: '3',
    title: 'Família em Orlando',
    leadName: 'Ana Carolina',
    leadEmail: 'ana.carol@email.com',
    destination: 'Orlando, EUA',
    totalAmount: 25430.00,
    status: 'signed',
    createdAt: '2024-06-08T09:15:00Z',
    sentAt: '2024-06-08T10:00:00Z',
    viewedAt: '2024-06-08T16:45:00Z',
    signedAt: '2024-06-09T11:20:00Z'
  },
  {
    id: '4',
    title: 'Lua de Mel nas Maldivas',
    leadName: 'Carlos Silva',
    leadEmail: 'carlos.silva@email.com',
    destination: 'Maldivas',
    totalAmount: 32000.00,
    status: 'viewed',
    createdAt: '2024-06-07T14:00:00Z',
    sentAt: '2024-06-07T15:30:00Z',
    viewedAt: '2024-06-08T09:10:00Z'
  },
  {
    id: '5',
    title: 'Machu Picchu - Aventura Inca',
    leadName: 'Fernanda Lima',
    leadEmail: 'fernanda.lima@email.com',
    destination: 'Machu Picchu, Peru',
    totalAmount: 8900.00,
    status: 'rejected',
    createdAt: '2024-06-06T11:00:00Z',
    sentAt: '2024-06-06T12:15:00Z',
    viewedAt: '2024-06-07T08:30:00Z'
  }
]

interface ProposalListProps {
  onNewProposal?: () => void
  onEditProposal?: (proposalId: string) => void
}

export function ProposalList({ onNewProposal, onEditProposal }: ProposalListProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/propostas')
      const result = await response.json()

      if (result.success) {
        setProposals(result.data.proposals)
      }
    } catch (error) {
      console.error('Error fetching proposals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch =
      proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.destination.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusInfo = (status: Proposal['status']) => {
    return statusConfig[status]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Agora'
    if (diffInHours < 24) return `Há ${diffInHours}h`
    if (diffInHours < 48) return 'Ontem'
    return `Há ${Math.floor(diffInHours / 24)} dias`
  }

  const handleDownload = async (proposal: Proposal) => {
    try {
      const response = await fetch(`/api/propostas/${proposal.id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `proposta-${proposal.leadName.replace(/\s+/g, '-')}.html`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        alert('Erro ao gerar PDF')
      }
    } catch (error) {
      console.error('Error downloading proposal:', error)
      alert('Erro ao baixar proposta')
    }
  }

  const handleSend = async (proposal: Proposal) => {
    try {
      const response = await fetch(`/api/propostas/${proposal.id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `Proposta: ${proposal.title}`,
          message: `Prezado(a),\n\nAnexamos a proposta comercial conforme solicitado.\n\nAtenciosamente,\nAGIR Viagens`
        })
      })

      const result = await response.json()
      if (result.success) {
        // Update the proposal in the list
        setProposals(prev => prev.map(p =>
          p.id === proposal.id
            ? { ...p, status: 'sent', sentAt: new Date().toISOString() }
            : p
        ))
        alert('Proposta enviada com sucesso!')
      } else {
        alert('Erro ao enviar proposta: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      alert('Erro ao enviar proposta')
    }
  }

  const handleView = (proposal: Proposal) => {
    if (onEditProposal) {
      onEditProposal(proposal.id)
    }
  }

  const handleDelete = async (proposal: Proposal) => {
    if (confirm(`Tem certeza que deseja excluir a proposta "${proposal.title}"?`)) {
      try {
        const response = await fetch(`/api/propostas/${proposal.id}`, {
          method: 'DELETE'
        })

        const result = await response.json()
        if (result.success) {
          setProposals(prev => prev.filter(p => p.id !== proposal.id))
          alert('Proposta excluída com sucesso!')
        } else {
          alert('Erro ao excluir proposta: ' + result.error)
        }
      } catch (error) {
        console.error('Error deleting proposal:', error)
        alert('Erro ao excluir proposta')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
          <p className="text-gray-600">Gerencie todas as propostas comerciais</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={onNewProposal}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar propostas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                Todas ({proposals.length})
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
              >
                Rascunho ({proposals.filter(p => p.status === 'draft').length})
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('sent')}
              >
                Enviadas ({proposals.filter(p => p.status === 'sent').length})
              </Button>
              <Button
                variant={statusFilter === 'viewed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('viewed')}
              >
                Visualizadas ({proposals.filter(p => p.status === 'viewed').length})
              </Button>
              <Button
                variant={statusFilter === 'signed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('signed')}
              >
                Assinadas ({proposals.filter(p => p.status === 'signed').length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Proposals Grid */}
      {!loading && filteredProposals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProposals.map((proposal) => {
            const statusInfo = getStatusInfo(proposal.status)
            const StatusIcon = statusInfo.icon

            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate mb-1">
                        {proposal.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(proposal)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(proposal)}>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </DropdownMenuItem>
                        {proposal.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleSend(proposal)}>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(proposal)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Client Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="truncate">{proposal.leadName}</span>
                    </div>
                    {proposal.leadEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{proposal.leadEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{proposal.destination}</span>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Valor Total</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {proposal.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Criada {formatDate(proposal.createdAt)}</span>
                    </div>

                    {proposal.sentAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Send className="w-3 h-3" />
                        <span>Enviada {getRelativeTime(proposal.sentAt)}</span>
                      </div>
                    )}

                    {proposal.viewedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Eye className="w-3 h-3" />
                        <span>Visualizada {getRelativeTime(proposal.viewedAt)}</span>
                      </div>
                    )}

                    {proposal.signedAt && (
                      <div className="flex items-center gap-2 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Assinada {formatDate(proposal.signedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleView(proposal)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownload(proposal)}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      PDF
                    </Button>
                    {proposal.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSend(proposal)}
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {!loading && filteredProposals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma proposta encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Tente ajustar os filtros ou busca'
                : 'Comece criando sua primeira proposta'
              }
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={onNewProposal}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Proposta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}