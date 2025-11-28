import { NextResponse } from 'next/server'

export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export type PaginatedResponse<T> = ApiResponse<{
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}>

/**
 * Padroniza resposta de sucesso da API
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Padroniza resposta de erro da API
 */
export function errorResponse(
  error: string,
  status: number = 400,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Padroniza resposta paginada
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / perPage)

  return NextResponse.json(
    {
      success: true,
      data: {
        items,
        total,
        page,
        perPage,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/**
 * Trata erros comuns da API
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Erro do Prisma
    if (error.message.includes('Unique constraint')) {
      return errorResponse('Registro já existe', 409)
    }

    if (error.message.includes('Foreign key constraint')) {
      return errorResponse('Registro relacionado não encontrado', 404)
    }

    if (error.message.includes('Record to delete does not exist')) {
      return errorResponse('Registro não encontrado', 404)
    }

    // Erro de validação
    if (error.name === 'ZodError') {
      return errorResponse('Dados inválidos', 422, error)
    }

    // Erro genérico
    return errorResponse(error.message, 500)
  }

  // Erro desconhecido
  return errorResponse('Erro interno do servidor', 500)
}

/**
 * Valida parâmetros obrigatórios
 */
export function validateRequired(
  data: Record<string, any>,
  required: string[]
): { valid: boolean; missing?: string[] } {
  const missing = required.filter((field) => !data[field])

  if (missing.length > 0) {
    return { valid: false, missing }
  }

  return { valid: true }
}

/**
 * Valida paginação
 */
export function validatePagination(
  page?: string | null,
  perPage?: string | null
): { page: number; perPage: number } {
  const parsedPage = parseInt(page || '1', 10)
  const parsedPerPage = parseInt(perPage || '10', 10)

  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    perPage:
      isNaN(parsedPerPage) || parsedPerPage < 1 || parsedPerPage > 100
        ? 10
        : parsedPerPage,
  }
}

/**
 * Calcula offset para paginação
 */
export function calculatePagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}
