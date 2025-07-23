import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { getClient } from './db-client'

const openaiKey = process.env.OPENAI_API_KEY
if (!openaiKey) throw new Error('Missing OPENAI_API_KEY')
const openai = new OpenAI({ apiKey: openaiKey })
const MODEL = process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini'

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }
  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { title, description = '', prompt } = data
  if (typeof title !== 'string' || !title.trim()) return { statusCode: 400, body: 'Invalid title' }
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const res = await client.query(
      `INSERT INTO kanban_boards(id, user_id, title, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [randomUUID(), data.userId ?? null, title.trim()]
    )
    const boardId = res.rows[0].id
    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      const messages = [
        { role: 'system', content: 'Generate a JSON array of kanban column titles based on the user prompt.' },
        { role: 'user', content: prompt }
      ]
      try {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          messages: messages as any,
          max_tokens: 100
        })
        const text = completion.choices?.[0]?.message?.content
        if (text) {
          JSON.parse(text)
        }
      } catch {
        // ignore AI errors
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
