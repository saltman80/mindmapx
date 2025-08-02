import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import { generateAIResponse } from './ai-generate.js'
import { requireAuth } from '../lib/auth.js'
import { getClient } from './db-client.js'
import { checkAiLimit, logAiUsage } from './usage-utils.js'
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
    ;({ userId } = requireAuth(event))
    if (!(await checkAiLimit(userId))) {
      return { statusCode: 429, body: 'AI limit reached' }
    }
    await logAiUsage(userId)
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { prompt, title } = data
  if (typeof title !== 'string' || !title.trim()) {
    return { statusCode: 400, body: 'Invalid title' }
  }
  if (!prompt || typeof prompt !== 'string') {
    return { statusCode: 400, body: 'Invalid prompt' }
  }
  const listTitle = title.trim()

  try {
    const content = await generateAIResponse(
      prompt,
      'Generate a JSON array of todo items. Limit to 20 items, each with a title and note field. Respond only with JSON without code fences or quotes.\nExample:\n[{"title":"Sample","note":"Details"}]'
    )
    let todosRaw: unknown
    try { todosRaw = JSON.parse(content) } catch { todosRaw = [] }
    const todos = Array.isArray(todosRaw) ? todosRaw : []

    const client = await getClient()
    try {
      await client.query('BEGIN')
      const listRes = await client.query(
        'INSERT INTO todo_lists (user_id, title) VALUES ($1,$2) RETURNING id',
        [userId, listTitle]
      )
      const listId = listRes.rows[0].id

      for (const item of todos) {
        const todoTitle = typeof (item as any).title === 'string' ? (item as any).title : null
        if (!todoTitle) continue
        const note = typeof (item as any).note === 'string' ? (item as any).note : null
        await client.query(
          'INSERT INTO todos (user_id, title, description, list_id, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),NOW())',
          [userId, todoTitle, note, listId]
        )
      }
      await client.query('COMMIT')
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: listId })
      }
    } catch (err) {
      await client.query('ROLLBACK')
      console.error(err)
      return { statusCode: 500, body: 'Internal Server Error' }
    } finally {
      client.release()
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
