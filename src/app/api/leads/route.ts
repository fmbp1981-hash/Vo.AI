import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse, 
  handleApiError,
  validatePagination,
  calculatePagination
} from '@/lib/api-response'
import { withErrorHandler, withRateLimit } from '@/lib/api-middleware'

export const GET = withErrorHandler(async (request: NextRequest) => {
  return withRateLimit(request, 200, 60000, async (req) => {
    const { searchParams } = new URL(req.url)
    const estagio = searchParams.get('estagio')
    const assignedTo = searchParams.get('assignedTo')
    const search = searchParams.get('search')
    const page = searchParams.get('page')
    const perPage = searchParams.get('perPage')

    // Validar paginação
    const { page: validPage, perPage: validPerPage } = validatePagination(page, perPage)
    const { skip, take } = calculatePagination(validPage, validPerPage)

    // Construir filtros
    const whereClause: any = {}
    
    if (estagio) {
      whereClause.estagio = estagio
    }

    if (assignedTo) {
      whereClause.assignedTo = assignedTo
    }

    if (search) {
      whereClause.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
        { destino: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Buscar leads
    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where: whereClause,
        orderBy: [
          { dataUltimaMensagem: 'desc' },
          { created: 'desc' }
        ],
        skip,
        take,
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            }
          }
        }
      }),
      db.lead.count({ where: whereClause })
    ])

    // Agrupar por estágio para visualização de pipeline
    const pipeline = leads.reduce((acc, lead) => {
      const stage = lead.estagio || 'Novo Lead'
      if (!acc[stage]) {
        acc[stage] = []
      }
      acc[stage].push(lead)
      return acc
    }, {} as Record<string, typeof leads>)

    return paginatedResponse(
      leads.map(lead => ({
        ...lead,
        pipeline,
        stats: {
          total,
          byStage: Object.keys(pipeline).length
        }
      })),
      total,
      validPage,
      validPerPage
    )
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      nome,
      email,
      telefone,
      destino,
      dataPartida,
      dataRetorno,
      orcamento,
      pessoas,
      canal,
      userId,
      ...otherFields
    } = body

    // Validate required fields
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Create new lead
    const newLead = await db.lead.create({
      data: {
        nome,
        email,
        telefone,
        destino,
        dataPartida: dataPartida ? new Date(dataPartida) : undefined,
        dataRetorno: dataRetorno ? new Date(dataRetorno) : undefined,
        orcamento,
        pessoas,
        canal,
        userId,
        estagio: 'Novo Lead',
        score: calculateInitialScore(body),
        ...otherFields
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newLead
    })

  } catch (error: any) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao criar lead',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

function calculateInitialScore(leadData: any): number {
  let score = 0
  
  // Base score for having contact info
  if (leadData.email) score += 10
  if (leadData.telefone) score += 10
  
  // Score for trip details
  if (leadData.destino) score += 15
  if (leadData.dataPartida) score += 10
  if (leadData.dataRetorno) score += 10
  if (leadData.orcamento) score += 20
  if (leadData.pessoas) score += 5
  
  // Score for channel quality
  if (leadData.canal === 'WhatsApp') score += 10
  if (leadData.canal === 'Email') score += 8
  if (leadData.canal === 'Webchat') score += 12
  
  // Bonus for complete information
  if (leadData.email && leadData.telefone && leadData.destino && leadData.orcamento) {
    score += 20
  }
  
  return Math.min(score, 100)
}