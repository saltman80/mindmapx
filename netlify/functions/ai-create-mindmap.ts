import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"
import OpenAI from 'openai'
import { randomUUID } from 'crypto'
import { getClient } from '../netlify/functions/db-client'

const db = getClient()
const openaiKey = process.env.OPENAI_API_KEY
if (!openaiKey) throw new Error('Missing OPENAI_API_KEY')
const openai = new OpenAI({ apiKey: openaiKey })
const MODEL = process.env.OPENAI_DEFAULT_MODEL ?? 'gpt-4o-mini'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }
  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }
  const { title, description = '', prompt } = data
  if (typeof title !== 'string' || !title.trim()) return { statusCode: 400, body: 'Invalid title' }
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const res = await client.query(
      `INSERT INTO mind_maps(id, user_id, title, description, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
      [randomUUID(), data.userId ?? null, title.trim(), description.trim() || null]
    )
    const mapId = res.rows[0].id
    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Generate a JSON array of mind map node titles based on the user prompt.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200
      })
      const text = completion.choices?.[0]?.message?.content
      if (text) {
        try {
          const items: string[] = JSON.parse(text)
          for (const t of items) {
            await client.query(
              `INSERT INTO nodes(id, mind_map_id, parent_id, data) VALUES ($1,$2,NULL,$3)`,
              [randomUUID(), mapId, JSON.stringify({ content: String(t) })]
            )
          }
        } catch {
          // ignore parse errors
        }
      }
    }
    await client.query('COMMIT')
    return { statusCode: 201, body: JSON.stringify({ id: mapId }) }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
