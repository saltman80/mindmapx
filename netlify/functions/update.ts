import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { getClient } from './db-client.js'
import { z, ZodError } from 'zod'

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,PATCH,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
}

const idSchema = z.string().uuid('Invalid id')

const resourceConfigs: Record<string, { table: string; schema: z.ZodTypeAny }> = {
  mindmap: {
    table: 'mindmaps',
    schema: z
      .object({
        title: z.string().min(1).optional(),
        description: z.string().optional()
      })
      .refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided'
      })
  },
  node: {
    table: 'nodes',
    schema: z
      .object({
        content: z.string().optional(),
        position: z
          .object({ x: z.number(), y: z.number() })
          .optional()
      })
      .refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided'
      })
  },
  todo: {
    table: 'todos',
    schema: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        due_date: z.string().optional()
      })
      .refine(data => Object.keys(data).length > 0, {
        message: 'At least one field must be provided'
      })
  }
}

export const handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }
  try {
    const path = event.rawPath || event.path || ''
    const parts = path.split('/').filter(Boolean)
    const idx = parts.findIndex(p => p === 'update')
    const resource = parts[idx + 1]
    const id = parts[idx + 2]
    if (!resource || !resourceConfigs[resource] || !id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid resource or id' })
      }
    }
    idSchema.parse(id)
    const config = resourceConfigs[resource]

    let payload: unknown = {}
    if (event.body) {
      try {
        payload = JSON.parse(event.body)
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid JSON body' })
        }
      }
    }

    const parsedBody = config.schema.parse(payload)
    const keys = Object.keys(parsedBody)
    const setClause = keys.map((k, i) => `"${k}"=$${i + 1}`).join(', ')
    const values = keys.map(k => (parsedBody as any)[k])
    const db = await getClient()
    const query = `UPDATE "${config.table}" SET ${setClause} WHERE id=$${
      keys.length + 1
    } RETURNING *`
    const result = await db.query(query, [...values, id])
    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Resource not found' })
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows[0])
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ errors: error.errors })
      }
    }
    console.error(error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}