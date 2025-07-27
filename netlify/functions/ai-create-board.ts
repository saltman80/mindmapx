import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { randomUUID } from 'crypto'
import { getClient } from './db-client.js'
import { generateAIResponse } from './ai-generate.js'
import { requireAuth } from './middleware.js'

import { checkAiLimit, logAiUsage } from "./usage-utils.js"
export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }

  let userId: string
  try {
    userId = await requireAuth(event)
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  if (!(await checkAiLimit(userId))) {
    return { statusCode: 429, body: 'AI limit reached' }
  }
  await logAiUsage(userId)

  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { title, description = '', prompt } = data
  if (typeof title !== 'string' || !title.trim()) return { statusCode: 400, body: 'Invalid title' }

  const client = await getClient()
  try {
    await client.query('BEGIN')
    const res = await client.query(
      `INSERT INTO kanban_boards(id, user_id, title, description, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [randomUUID(), userId, title.trim(), description.trim() || null]
    )
    const boardId = res.rows[0].id

    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      try {
        await generateAIResponse(
          `Generate a kanban board JSON from: "${prompt}". Limit to 40 cards total. There must be a column titled New that contains all generated cards. Respond only with JSON.\nExample:\n{"columns":[{"title":"New","cards":[{"title":"Sample"}]}]}`
        )
      } catch (err) {
        console.error('AI error:', err)
      }
    }
    await client.query('COMMIT')
    return { statusCode: 201, body: JSON.stringify({ id: boardId }) }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
