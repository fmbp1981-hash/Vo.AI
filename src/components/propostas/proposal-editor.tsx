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
import { 
  FileText,
  Download,
  Send,
  Eye,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Plus,
  Minus
} from 'lucide-react'

interface ProposalItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  category: string
}

interface ProposalData {
  id: string
  leadId: string
  leadName: string
  title: string
  destination: string
  startDate: string
  endDate: string
  travelers: string
  items: ProposalItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  terms: string
  notes: string
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'rejected'
  createdAt: string
  sentAt?: string
  viewedAt?: string
  signedAt?: string
}

const sampleProposalData: ProposalData = {
  id: '1',
  leadId: '1',
  leadName: 'Maria Santos',
  title: 'Pacote Romântico Paris 2024',
  destination: 'Paris, França',
  startDate: '2024-07-15',
  endDate: '2024-07-22',
  travelers: '2 adultos',
  items: [
    {
      id: '1',
      description: 'Passagens Aéreas - São Paulo ↔ Paris',
      quantity: 2,
      unitPrice: 4500,
      totalPrice: 9000,
      category: 'Transporte'
    },
    {
      id: '2',
      description: 'Hotel Mercure Paris Centre Tour Eiffel - 7 noites',
      quantity: 7,
      unitPrice: 350,
      totalPrice: 2450,
      category: 'Hospedagem'
    },
    {
      id: '3',
      description: 'Passeio guiado Torre Eiffel + Museu do Louvre',
      quantity: 2,
      unitPrice: 150,
      totalPrice: 300,
      category: 'Passeios'
    },
    {
      id: '4',
      description: 'Seguro Viagem Completo',
      quantity: 2,
      unitPrice: 200,
      totalPrice: 400,
      category: 'Seguro'
    },
    {
      id: '5',
      description: 'Transfer Aeroporto ↔ Hotel',
      quantity: 2,
      unitPrice: 100,
      totalPrice: 200,
      category: 'Transporte'
    }
  ],
  subtotal: 12350,
  taxRate: 5,
  taxAmount: 617.50,
  totalAmount: 12967.50,
  terms: 'Proposta válida por 48 horas. 50% de sinal para confirmação. Cancelamento gratuito até 30 dias antes da viagem.',
  notes: 'Inclui café da manhã diário. Pacote não reembolsável após confirmação.',
  status: 'draft',
  createdAt: '2024-06-10T10:00:00Z'
}

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Edit },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: 'Visualizada', color: 'bg-yellow-100 text-yellow-700', icon: Eye },
  signed: { label: 'Assinada', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-700', icon: AlertCircle }
}

interface ProposalEditorProps {
  proposalId?: string | null
  onBack?: () => void
}

export function ProposalEditor({ proposalId, onBack }: ProposalEditorProps) {
  const [proposalData, setProposalData] = useState<ProposalData>(sampleProposalData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (proposalId) {
      fetchProposal(proposalId)
    }
  }, [proposalId])

  const fetchProposal = async (id: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/propostas/${id}`)
      const result = await response.json()
      
      if (result.success) {
        // Parse content if needed
        let content = result.data.content
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content)
          } catch (e) {
            console.error('Error parsing content:', e)
          }
        }
        
        setProposalData({
          ...result.data,
          items: content?.items || sampleProposalData.items,
          subtotal: content?.subtotal || sampleProposalData.subtotal,
          taxRate: content?.taxRate || sampleProposalData.taxRate,
          taxAmount: content?.taxAmount || sampleProposalData.taxAmount,
          totalAmount: content?.totalAmount || result.data.totalValue || sampleProposalData.totalAmount,
          terms: content?.terms || result.data.terms || sampleProposalData.terms,
          notes: content?.notes || result.data.notes || sampleProposalData.notes
        })
      }
    } catch (error) {
      console.error('Error fetching proposal:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateItem = (itemId: string, field: keyof ProposalItem, value: any) => {
    setProposalData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, [field]: value }
          : item
      )
    }))
  }

  const addItem = () => {
    const newItem: ProposalItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'Outros'
    }
    setProposalData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (itemId: string) => {
    setProposalData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const calculateTotals = () => {
    const subtotal = proposalData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = subtotal * (proposalData.taxRate / 100)
    const totalAmount = subtotal + taxAmount

    setProposalData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }))
  }

  React.useEffect(() => {
    calculateTotals()
  }, [proposalData.items, proposalData.taxRate])

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would generate and download the PDF
      const blob = new Blob(['PDF content'], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposta-${proposalData.leadName.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const saveProposal = async () => {
    setSaving(true)
    try {
      const content = {
        items: proposalData.items,
        subtotal: proposalData.subtotal,
        taxRate: proposalData.taxRate,
        taxAmount: proposalData.taxAmount,
        totalAmount: proposalData.totalAmount
      }

      const payload = {
        title: proposalData.title,
        content,
        totalValue: proposalData.totalAmount,
        terms: proposalData.terms,
        notes: proposalData.notes,
        leadId: proposalData.leadId,
        userId: 'current-user-id' // In real app, get from auth
      }

      const url = proposalId ? `/api/propostas/${proposalId}` : '/api/propostas'
      const method = proposalId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (result.success) {
        alert('Proposta salva com sucesso!')
        if (onBack) onBack()
      } else {
        alert('Erro ao salvar proposta: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving proposal:', error)
      alert('Erro ao salvar proposta')
    } finally {
      setSaving(false)
    }
  }

  const sendProposal = async () => {
    if (!proposalId) {
      alert('Salve a proposta antes de enviar')
      return
    }

    try {
      const response = await fetch(`/api/propostas/${proposalId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: `Proposta: ${proposalData.title}`,
          message: `Prezado(a) ${proposalData.leadName},\n\nAnexamos a proposta comercial conforme solicitado.\n\nAtenciosamente,\nAGIR Viagens`
        })
      })

      const result = await response.json()
      if (result.success) {
        alert('Proposta enviada com sucesso!')
        setProposalData(prev => ({ ...prev, status: 'sent', sentAt: new Date().toISOString() }))
      } else {
        alert('Erro ao enviar proposta: ' + result.error)
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      alert('Erro ao enviar proposta')
    }
  }

  const StatusIcon = statusConfig[proposalData.status].icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              ← Voltar
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editor de Proposta</h1>
            <p className="text-gray-600">Crie e personalize propostas para seus clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig[proposalData.status].color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig[proposalData.status].label}
          </Badge>
          <Button variant="outline" onClick={generatePDF} disabled={isGenerating}>
            <Download className="w-4 h-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Baixar PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={saveProposal} 
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={sendProposal}
            disabled={!proposalId || proposalData.status !== 'draft'}
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Proposta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Detalhes da Proposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título da Proposta</Label>
                  <Input
                    id="title"
                    value={proposalData.title}
                    onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="leadName">Cliente</Label>
                  <Input
                    id="leadName"
                    value={proposalData.leadName}
                    onChange={(e) => setProposalData(prev => ({ ...prev, leadName: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    value={proposalData.destination}
                    onChange={(e) => setProposalData(prev => ({ ...prev, destination: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="travelers">Viajantes</Label>
                  <Input
                    id="travelers"
                    value={proposalData.travelers}
                    onChange={(e) => setProposalData(prev => ({ ...prev, travelers: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={proposalData.startDate}
                    onChange={(e) => setProposalData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={proposalData.endDate}
                    onChange={(e) => setProposalData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Itens da Proposta</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposalData.items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2">
                        <Label>Descrição</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Descrição do item"
                        />
                      </div>
                      
                      <div>
                        <Label>Categoria</Label>
                        <Select 
                          value={item.category} 
                          onValueChange={(value) => updateItem(item.id, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Transporte">Transporte</SelectItem>
                            <SelectItem value="Hospedagem">Hospedagem</SelectItem>
                            <SelectItem value="Passeios">Passeios</SelectItem>
                            <SelectItem value="Alimentação">Alimentação</SelectItem>
                            <SelectItem value="Seguro">Seguro</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value) || 0
                            updateItem(item.id, 'quantity', quantity)
                            updateItem(item.id, 'totalPrice', quantity * item.unitPrice)
                          }}
                        />
                      </div>

                      <div>
                        <Label>Valor Unitário (R$)</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const unitPrice = parseFloat(e.target.value) || 0
                            updateItem(item.id, 'unitPrice', unitPrice)
                            updateItem(item.id, 'totalPrice', item.quantity * unitPrice)
                          }}
                        />
                      </div>

                      <div>
                        <Label>Total (R$)</Label>
                        <Input
                          type="number"
                          value={item.totalPrice}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Terms and Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Termos e Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="terms">Termos e Condições</Label>
                <Textarea
                  id="terms"
                  value={proposalData.terms}
                  onChange={(e) => setProposalData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={4}
                  placeholder="Termos e condições da proposta..."
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={proposalData.notes}
                  onChange={(e) => setProposalData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Observações adicionais..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">R$ {proposalData.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Impostos ({proposalData.taxRate}%)</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={proposalData.taxRate}
                      onChange={(e) => setProposalData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-16 h-6 text-xs"
                    />
                    <span className="font-medium">R$ {proposalData.taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">R$ {proposalData.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={generatePDF} disabled={isGenerating}>
                  <Download className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
                <Button variant="outline" className="w-full" onClick={sendProposal} disabled={!proposalId || proposalData.status !== 'draft'}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
                <Button variant="outline" className="w-full" onClick={saveProposal} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Proposta'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Criada</p>
                    <p className="text-xs text-gray-500">
                      {new Date(proposalData.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                {proposalData.sentAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Enviada</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposalData.sentAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {proposalData.viewedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Visualizada</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposalData.viewedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
                
                {proposalData.signedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Assinada</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposalData.signedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}