const { OPENAI_API_KEY, DATABASE_URL } = process.env

if (!OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY')
}
if (!DATABASE_URL) {
  throw new Error('Missing DATABASE_URL')
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
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
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a task generation assistant. Generate a JSON array of todo items based on the user prompt. Each item should have a content field.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
    const aiMessage = aiResponse.choices?.[0]?.message?.content
    if (!aiMessage) throw new Error('Empty AI response')
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