import { generateCompletion } from '../openaiclient.js'
const { DATABASE_URL } = process.env
if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL')
}
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: true }
})

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body: any
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' }
  }

  const { prompt, nodeId } = body
  if (typeof prompt !== 'string' || typeof nodeId !== 'string') {
    return { statusCode: 400, body: 'Missing prompt or nodeId' }
  }

  let todosInput: any
  try {
    const aiMessage = await generateCompletion(prompt, {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 256
    })
    todosInput = JSON.parse(aiMessage)
    if (!Array.isArray(todosInput)) throw new Error('AI response is not an array')
  } catch (err) {
    console.error('AI generation error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate todos' })
    }
  }

  const validTodos = todosInput.filter((t: any): t is { content: string } => t && typeof t.content === 'string')
  if (validTodos.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ todos: [] })
    }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const values: any[] = []
    const placeholders = validTodos
      .map((todo, i) => {
        values.push(nodeId, todo.content)
        return `($${i * 2 + 1}, $${i * 2 + 2})`
      })
      .join(', ')
    const insertQuery = `
      INSERT INTO todos (node_id, content)
      VALUES ${placeholders}
      RETURNING id, node_id, content, completed, created_at
    `
    const result = await client.query(insertQuery, values)
    await client.query('COMMIT')
    return {
      statusCode: 200,
      body: JSON.stringify({ todos: result.rows })
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Database error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save todos' })
    }
  } finally {
    client.release()
  }
}