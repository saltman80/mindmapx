import type { HandlerEvent, HandlerContext } from '@netlify/functions'
import type { Handler } from './types.js'
import { getClient } from './db-client.js'
import OpenAI from 'openai'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'


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

    const client = await getClient()
    try {
      const ownershipResult = await client.query(
        'SELECT 1 FROM mindmaps WHERE id = $1 AND user_id = $2',
        [data.mindMapId, userId]
      )
      const count = ownershipResult.rowCount ?? 0
      if (count === 0) {
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

      const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
      const completion = await ai.chat.completions.create({
        model: data.model,
        messages: messages.map(m => ({
          role: m.role as any,
          content: m.content,
          name: (m as any).name ?? undefined
        })),
        max_tokens: data.maxTokens
      })
      const aiContent = completion.choices?.[0]?.message?.content
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

      await client.query('BEGIN')
      const insertedTodos = [] as any[]
      for (const item of validTodos) {
        const id = uuidv4()
        const result = await client.query(
          `INSERT INTO todos (id, user_id, mindmap_id, node_id, title, description, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING
             id AS "id",
             user_id AS "userId",
             mindmap_id AS "mindMapId",
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
      await client.query('ROLLBACK').catch(() => {})
      console.error('DB transaction error:', err)
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
    } finally {
      await client.release()
    }
  } catch (err) {
    console.error('AI Generate Error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal Server Error' }) }
  }
}