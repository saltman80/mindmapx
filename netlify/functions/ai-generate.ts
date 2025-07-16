import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { createPool } from '@vercel/postgres'
import OpenAI from 'openai'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('Missing DATABASE_URL')
const pool = createPool(databaseUrl)

const openaiKey = process.env.OPENAI_API_KEY
if (!openaiKey) throw new Error('Missing OPENAI_API_KEY')
const openai = new OpenAI({ apiKey: openaiKey })

const DEFAULT_MODEL = 'gpt-3.5-turbo'
const DEFAULT_MAX_TOKENS = 150

const requestSchema = z.object({
  mindMapId: z.string().uuid(),
  nodeId: z.string().uuid().optional(),
  prompt: z.string().min(1),
  model: z.string().optional().default(DEFAULT_MODEL),
  maxTokens: z.number().int().min(1).max(2048).optional().default(DEFAULT_MAX_TOKENS)
})

const todoItemSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional()
})
const todosResponseSchema = z.array(todoItemSchema).max(50)

const headers = { 'Content-Type': 'application/json' }

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  try {
    const user = context.clientContext?.user
    if (!user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    const userId = (user.sub as string) || (user.id as string) || null
    if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }

    let body: unknown
    try {
      body = JSON.parse(event.body)
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
    }

    let data
    try {
      data = requestSchema.parse(body)
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request data', details: (err as any).errors })
      }
    }

    const ownershipResult = await pool.query(
      'SELECT 1 FROM mind_maps WHERE id = $1 AND user_id = $2',
      [data.mindMapId, userId]
    )
    if (ownershipResult.rowCount === 0) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Mind map not found' }) }
    }

    const messages = [
      {
        role: 'system',
        content:
          "You are an AI assistant that generates to-do items based on the user's prompt. Respond strictly with a JSON array of objects with 'title' and optional 'description' fields."
      },
      { role: 'user', content: data.prompt }
    ]

    const completion = await openai.createChatCompletion({
      model: data.model,
      messages,
      max_tokens: data.maxTokens
    })
    const aiContent = completion.data.choices?.[0]?.message?.content
    if (!aiContent) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'No content from AI' }) }
    }

    let aiTodos: unknown
    try {
      aiTodos = JSON.parse(aiContent)
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to parse AI response', details: (err as Error).message })
      }
    }

    let validTodos
    try {
      validTodos = todosResponseSchema.parse(aiTodos)
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'AI response validation failed', details: (err as any).errors })
      }
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const insertedTodos = []
      for (const item of validTodos) {
        const id = uuidv4()
        const result = await client.query(
          `INSERT INTO todos (id, user_id, mind_map_id, node_id, title, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING
             id AS "id",
             user_id AS "userId",
             mind_map_id AS "mindMapId",
             node_id AS "nodeId",
             title,
             description,
             created_at AS "createdAt"`,
          [id, userId, data.mindMapId, data.nodeId ?? null, item.title, item.description ?? null]
        )
        insertedTodos.push(result.rows[0])
      }
      await client.query('COMMIT')
      return { statusCode: 200, headers, body: JSON.stringify({ todos: insertedTodos }) }
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('DB transaction error:', err)
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('AI Generate Error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}