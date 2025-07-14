const client = createClient({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
})

type Todo = {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

type TodoInput = {
  title?: string
  description?: string | null
  completed?: boolean
}

const updateTodoSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

async function getTodo(todoId: string, userId: string): Promise<Todo> {
  const result = await client.query(
    'SELECT id, user_id, title, description, completed, created_at, updated_at FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, userId]
  )
  if (result.rowCount === 0) {
    throw new Error('NotFound')
  }
  return result.rows[0]
}

async function updateTodo(
  todoId: string,
  data: TodoInput,
  userId: string
): Promise<Todo> {
  const fields: string[] = []
  const values: any[] = []
  let idx = 1
  if (data.title !== undefined) {
    fields.push(`title = $${idx++}`)
    values.push(data.title)
  }
  if (data.description !== undefined) {
    fields.push(`description = $${idx++}`)
    values.push(data.description)
  }
  if (data.completed !== undefined) {
    fields.push(`completed = $${idx++}`)
    values.push(data.completed)
  }
  values.push(todoId, userId)
  const idPos = idx++
  const userPos = idx
  const query = `
    UPDATE todos
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = $${idPos} AND user_id = $${userPos}
    RETURNING id, user_id, title, description, completed, created_at, updated_at
  `
  const result = await client.query(query, values)
  if (result.rowCount === 0) {
    throw new Error('NotFound')
  }
  return result.rows[0]
}

async function deleteTodo(todoId: string, userId: string): Promise<void> {
  const result = await client.query(
    'DELETE FROM todos WHERE id = $1 AND user_id = $2',
    [todoId, userId]
  )
  if (result.rowCount === 0) {
    throw new Error('NotFound')
  }
}

export const handler: Handler = async (event, context) => {
  try {
    const identity = context.clientContext?.identity
    if (!identity || !identity.sub) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }
    const userId = identity.sub
    const todoId = event.pathParameters?.todoid
    if (!todoId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing todoId' }),
      }
    }
    switch (event.httpMethod) {
      case 'GET': {
        const todo = await getTodo(todoId, userId)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todo),
        }
      }
      case 'PUT': {
        let rawData: any
        try {
          rawData = JSON.parse(event.body || '{}')
        } catch {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid JSON' }),
          }
        }
        const parseResult = updateTodoSchema.safeParse(rawData)
        if (!parseResult.success) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: parseResult.error.errors.map(e => e.message).join(', ') }),
          }
        }
        const updated = await updateTodo(todoId, parseResult.data, userId)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }
      }
      case 'DELETE': {
        await deleteTodo(todoId, userId)
        return {
          statusCode: 204,
        }
      }
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            Allow: 'GET, PUT, DELETE',
          },
          body: JSON.stringify({ error: 'Method Not Allowed' }),
        }
    }
  } catch (err: any) {
    if (err.message === 'NotFound') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Todo not found' }),
      }
    }
    console.error(err)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    }
  }
}