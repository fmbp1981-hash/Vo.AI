import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { errorResponse } from './api-response'

/**
 * Middleware de autenticação
 */
export async function requireAuth(
  request: NextRequest,
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession()

  if (!session) {
    return errorResponse('Não autenticado', 401)
  }

  return handler(request, session)
}

/**
 * Middleware de autorização por role
 */
export async function requireRole(
  request: NextRequest,
  roles: string[],
  handler: (req: NextRequest, session: any) => Promise<NextResponse>
): Promise<NextResponse> {
  const session = await getServerSession()

  if (!session) {
    return errorResponse('Não autenticado', 401)
  }

  const userRole = (session.user as any)?.role

  if (!roles.includes(userRole)) {
    return errorResponse('Sem permissão', 403)
  }

  return handler(request, session)
}

/**
 * Middleware de validação de método HTTP
 */
export async function requireMethod(
  request: NextRequest,
  allowedMethods: string[],
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  if (!allowedMethods.includes(request.method)) {
    return errorResponse(
      `Método ${request.method} não permitido`,
      405
    )
  }

  return handler(request)
}

/**
 * Middleware de tratamento de erros
 */
export async function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        return errorResponse(error.message, 500)
      }

      return errorResponse('Erro interno do servidor', 500)
    }
  }
}

/**
 * Middleware de rate limiting simples (in-memory)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>()

export async function withRateLimit(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60000, // 1 minuto
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()

  const current = requestCounts.get(ip)

  if (current && current.resetAt > now) {
    if (current.count >= limit) {
      return errorResponse('Muitas requisições. Tente novamente mais tarde.', 429)
    }

    current.count++
  } else {
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs })
  }

  // Limpeza periódica
  if (Math.random() < 0.01) {
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetAt < now) {
        requestCounts.delete(key)
      }
    }
  }

  return handler(request)
}

/**
 * Middleware de CORS
 */
export function withCORS(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    origin?: string
    methods?: string[]
    headers?: string[]
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)

    response.headers.set(
      'Access-Control-Allow-Origin',
      options.origin || '*'
    )

    response.headers.set(
      'Access-Control-Allow-Methods',
      options.methods?.join(', ') || 'GET, POST, PUT, DELETE, OPTIONS'
    )

    response.headers.set(
      'Access-Control-Allow-Headers',
      options.headers?.join(', ') || 'Content-Type, Authorization'
    )

    return response
  }
}

/**
 * Combina múltiplos middlewares
 */
export function composeMiddleware(
  ...middlewares: Array<
    (handler: (req: NextRequest) => Promise<NextResponse>) => (req: NextRequest) => Promise<NextResponse>
  >
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}
