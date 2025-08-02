import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { generateAIResponse } from './ai-generate.js'
import { requireAuth } from '../lib/auth.js'

import { checkAiLimit, logAiUsage } from "./usage-utils.js"
export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }

  try {
    const { userId } = requireAuth(event)
    if (!(await checkAiLimit(userId))) {
      return { statusCode: 429, body: 'AI limit reached' }
    }
    await logAiUsage(userId)
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { prompt } = data
  if (!prompt || typeof prompt !== 'string') return { statusCode: 400, body: 'Invalid prompt' }

  try {
    const content = await generateAIResponse(
      prompt,
      'Generate a JSON array of todo items. Limit to 20 items, each with a title and note field. Respond only with JSON without code fences or quotes.\nExample:\n[{"title":"Sample","note":"Details"}]'
    )
    let todos: unknown
    try { todos = JSON.parse(content) } catch { todos = [] }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ todos })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
