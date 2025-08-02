import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { requireAuth } from '../lib/auth.js'
import { trackAIUsage, getMonthlyUsage } from '../lib/ai/usage.js'
import { getAiLimit } from './usage-utils.js'

export const handler = async (event: HandlerEvent, _context: HandlerContext) => {
  let userId: string
  try {
    ;({ userId } = requireAuth(event))
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  const typeParam =
    event.httpMethod === 'GET'
      ? event.queryStringParameters?.type
      : (() => {
          try {
            return (JSON.parse(event.body || '{}') as any).type
          } catch {
            return undefined
          }
        })()

  if (typeParam !== 'mindmap' && typeParam !== 'todo' && typeParam !== 'kanban') {
    return { statusCode: 400, body: 'Invalid type' }
  }

  if (event.httpMethod === 'GET') {
    const usage = await getMonthlyUsage(userId, typeParam)
    const { limit } = await getAiLimit(userId)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usage, aiLimit: limit }),
    }
  }

  if (event.httpMethod === 'POST') {
    await trackAIUsage(userId, typeParam)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' }
}
