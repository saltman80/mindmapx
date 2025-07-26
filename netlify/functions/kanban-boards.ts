import { getClient } from './db-client.js'
import { extractToken, verifySession } from './auth.js'

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' }

  const token = extractToken(event)
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }

  const session = verifySession(token)
  const userId = (session as any)?.userId
  if (!userId) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }

  const client = await getClient()

  try {
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}')
      const title = data.title?.trim()
      const description = data.description?.trim() || null
      if (!title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Title required' }) }

      const res = await client.query(
        `
        INSERT INTO kanban_boards (user_id, title, description)
        VALUES ($1, $2, $3)
        RETURNING id, title, description, created_at
      `,
        [userId, title, description],
      )

      const boardId = res.rows[0].id
      const defaultCols = ['New', 'In-Progress', 'Reviewing', 'Done']
      for (let i = 0; i < defaultCols.length; i++) {
        await client.query(
          `
          INSERT INTO kanban_columns (board_id, title, position)
          VALUES ($1, $2, $3)
        `,
          [boardId, defaultCols[i], i],
        )
      }

      return { statusCode: 201, headers, body: JSON.stringify(res.rows[0]) }
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  } catch (err) {
    console.error('[kanban-boards] error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error' }) }
  } finally {
    client.release()
  }
}
