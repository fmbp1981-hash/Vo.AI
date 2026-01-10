import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, withErrorHandler } from '@/lib/api-middleware'
import { successResponse, errorResponse } from '@/lib/api-response'

export const GET = withErrorHandler(async (request: NextRequest) => {
  return requireAuth(request, async (_req, session) => {
    const tenantId = (session.user as any)?.tenantId as string | undefined

    if (!tenantId) {
      return errorResponse('Tenant não encontrado na sessão', 400)
    }

    const [waitingHandoff, humanAttending, standby, active] = await Promise.all([
      db.conversation.count({
        where: {
          tenantId,
          status: { in: ['waiting_handoff', 'waiting'] },
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          status: 'human_attending',
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          handoffMode: 'standby',
        },
      }),
      db.conversation.count({
        where: {
          tenantId,
          status: 'active',
        },
      }),
    ])

    return successResponse({
      waitingHandoff,
      humanAttending,
      standby,
      active,
      attention: waitingHandoff + humanAttending,
    })
  })
})
