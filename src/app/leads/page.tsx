"use client"

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail,
    Calendar,
    MapPin,
    User,
    Loader2,
    ArrowUpDown,
    Eye
} from 'lucide-react'
import { LeadFormDialog } from '@/components/lead-form-dialog'

interface Lead {
    id: string
    nome: string
    email?: string
    telefone?: string
    canal?: string
    destino?: string
    estagio: string
    status: string
    orcamento?: string
    pessoas?: string
    dataPartida?: string
    dataRetorno?: string
    dataNascimento?: string
    qualificado: boolean
    recorrente: boolean
    score: number
    created: string
    updatedAt: string
}

const STAGES = [
    'Todos',
    'Novo Lead',
    'Recorrente',
    'Qualificação',
    'Gerar Proposta',
    'Proposta Enviada',
    'Negociação',
    'Fechado',
    'Pós-Venda',
    'Cancelado',
    'Não Qualificado',
]

const STAGE_COLORS: Record<string, string> = {
    'Novo Lead': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Recorrente': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    'Qualificação': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Gerar Proposta': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'Proposta Enviada': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'Negociação': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Fechado': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Pós-Venda': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'Cancelado': 'bg-red-500/20 text-red-400 border-red-500/30',
    'Não Qualificado': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export default function LeadsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [stageFilter, setStageFilter] = useState('Todos')
    const [sortField, setSortField] = useState<keyof Lead>('created')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [page, setPage] = useState(1)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const itemsPerPage = 20

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/auth/login')
            return
        }
        fetchLeads()
    }, [session, status])

    const fetchLeads = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/leads')
            const data = await response.json()
            if (data.leads) {
                setLeads(data.leads)
            }
        } catch (error) {
            console.error('Error fetching leads:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter and sort leads
    const filteredLeads = useMemo(() => {
        let result = [...leads]

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase()
            result = result.filter(lead =>
                lead.nome?.toLowerCase().includes(searchLower) ||
                lead.email?.toLowerCase().includes(searchLower) ||
                lead.telefone?.includes(search) ||
                lead.destino?.toLowerCase().includes(searchLower)
            )
        }

        // Apply stage filter
        if (stageFilter !== 'Todos') {
            result = result.filter(lead => lead.estagio === stageFilter)
        }

        // Apply sorting
        result.sort((a, b) => {
            const aVal = a[sortField] || ''
            const bVal = b[sortField] || ''

            if (sortOrder === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
            }
        })

        return result
    }, [leads, search, stageFilter, sortField, sortOrder])

    // Paginate
    const paginatedLeads = useMemo(() => {
        const start = (page - 1) * itemsPerPage
        return filteredLeads.slice(start, start + itemsPerPage)
    }, [filteredLeads, page])

    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage)

    const handleSort = (field: keyof Lead) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const exportToCSV = () => {
        const headers = ['Nome', 'Email', 'Telefone', 'Canal', 'Destino', 'Estágio', 'Orçamento', 'Score', 'Criado']
        const rows = filteredLeads.map(lead => [
            lead.nome,
            lead.email || '',
            lead.telefone || '',
            lead.canal || '',
            lead.destino || '',
            lead.estagio,
            lead.orcamento || '',
            lead.score.toString(),
            new Date(lead.created).toLocaleDateString('pt-BR'),
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
        })
    }

    if (status === 'loading' || loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background">
            <aside className="w-64 flex-shrink-0 border-r border-border">
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold">Tabela de Leads</h1>
                                <p className="text-muted-foreground">
                                    {filteredLeads.length} leads encontrados
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={fetchLeads}>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Atualizar
                                </Button>
                                <Button variant="outline" onClick={exportToCSV}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar CSV
                                </Button>
                                <LeadFormDialog
                                    onSuccess={fetchLeads}
                                    trigger={
                                        <Button>
                                            <User className="w-4 h-4 mr-2" />
                                            Novo Lead
                                        </Button>
                                    }
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome, email, telefone ou destino..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Select value={stageFilter} onValueChange={setStageFilter}>
                                        <SelectTrigger className="w-[200px]">
                                            <Filter className="w-4 h-4 mr-2" />
                                            <SelectValue placeholder="Filtrar por estágio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STAGES.map(stage => (
                                                <SelectItem key={stage} value={stage}>
                                                    {stage}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Table */}
                        <Card>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/50">
                                                <TableHead
                                                    className="cursor-pointer hover:text-foreground"
                                                    onClick={() => handleSort('nome')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Nome
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </div>
                                                </TableHead>
                                                <TableHead>Contato</TableHead>
                                                <TableHead>Canal</TableHead>
                                                <TableHead>Destino</TableHead>
                                                <TableHead
                                                    className="cursor-pointer hover:text-foreground"
                                                    onClick={() => handleSort('estagio')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Estágio
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </div>
                                                </TableHead>
                                                <TableHead>Orçamento</TableHead>
                                                <TableHead
                                                    className="cursor-pointer hover:text-foreground text-center"
                                                    onClick={() => handleSort('score')}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        Score
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </div>
                                                </TableHead>
                                                <TableHead
                                                    className="cursor-pointer hover:text-foreground"
                                                    onClick={() => handleSort('created')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        Criado
                                                        <ArrowUpDown className="w-3 h-3" />
                                                    </div>
                                                </TableHead>
                                                <TableHead className="text-center">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedLeads.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                                                        Nenhum lead encontrado
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedLeads.map((lead) => (
                                                    <TableRow key={lead.id} className="hover:bg-muted/30">
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{lead.nome}</span>
                                                                <div className="flex gap-1">
                                                                    {lead.qualificado && (
                                                                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                                                            Qualificado
                                                                        </Badge>
                                                                    )}
                                                                    {lead.recorrente && (
                                                                        <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-400 border-teal-500/30">
                                                                            Recorrente
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1 text-sm">
                                                                {lead.telefone && (
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        <Phone className="w-3 h-3" />
                                                                        {lead.telefone}
                                                                    </div>
                                                                )}
                                                                {lead.email && (
                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                        <Mail className="w-3 h-3" />
                                                                        {lead.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="text-xs">
                                                                {lead.canal || '-'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {lead.destino ? (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                                                    {lead.destino}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={STAGE_COLORS[lead.estagio] || 'bg-gray-500/20 text-gray-400'}
                                                            >
                                                                {lead.estagio}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {lead.orcamento ? (
                                                                <span className="text-emerald-400">
                                                                    R$ {lead.orcamento}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div
                                                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${lead.score >= 70 ? 'bg-emerald-500/20 text-emerald-400' :
                                                                        lead.score >= 40 ? 'bg-amber-500/20 text-amber-400' :
                                                                            'bg-gray-500/20 text-gray-400'
                                                                    }`}
                                                            >
                                                                {lead.score}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(lead.created)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <LeadFormDialog
                                                                lead={lead}
                                                                onSuccess={fetchLeads}
                                                                trigger={
                                                                    <Button variant="ghost" size="sm">
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                }
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando {((page - 1) * itemsPerPage) + 1} - {Math.min(page * itemsPerPage, filteredLeads.length)} de {filteredLeads.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = page <= 3 ? i + 1 : page + i - 2
                                            if (pageNum > totalPages) return null
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
