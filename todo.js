const client = createClient({
  connectionString: process.env.DATABASE_URL
})

const jsonHeaders = {
  'Content-Type': 'application/json'
}

function getAuthenticatedUser(context) {
  const identity = context.clientContext && context.clientContext.identity
  if (!identity || !identity.sub) {
    return null
  }
  return { id: identity.sub }
}

export async function handler(event, context) {
  try {
    const user = getAuthenticatedUser(context)
    if (!user) {
      return {
        statusCode: 401,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }
    switch (event.httpMethod) {
      case 'GET':
        return await getTodos(event, user)
      case 'POST':
        return await createTodo(event, user)
      case 'PATCH':
        return await updateTodo(event, user)
      case 'DELETE':
        return await deleteTodo(event, user)
      default:
        return {
          statusCode: 405,
          headers: { ...jsonHeaders, Allow: 'GET, POST, PATCH, DELETE' },
          body: JSON.stringify({ error: 'Method not allowed' })
        }
    }
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'An unexpected error occurred' })
    }
  }
}

async function getTodos(event, user) {
  const params = event.queryStringParameters || {}
  const nodeId = params.nodeId
  if (!nodeId || typeof nodeId !== 'string') {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing or invalid nodeId parameter' })
    }
  }
  const res = await client.query(
    `SELECT
       id,
       node_id AS "nodeId",
       content,
       completed,
       created_at AS "createdAt",
       updated_at AS "updatedAt"
     FROM todos
     WHERE node_id = $1 AND user_id = $2
     ORDER BY created_at ASC`,
    [nodeId, user.id]
  )
  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify(res.rows)
  }
}

async function createTodo(event, user) {
  let data
  try {
    data = JSON.parse(event.body || '')
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    }
  }
  const { nodeId, content, completed = false, assigneeId = null } = data
  if (!nodeId || typeof nodeId !== 'string' || typeof content !== 'string' || typeof completed !== 'boolean') {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing or invalid nodeId/content/completed' })
    }
  }
  const res = await client.query(
    `INSERT INTO todos (node_id, content, completed, user_id, assignee_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING
       id,
       node_id AS "nodeId",
       content,
       completed,
       assignee_id AS "assigneeId",
       created_at AS "createdAt",
       updated_at AS "updatedAt"`,
    [nodeId, content, completed, user.id, assigneeId]
  )
  return {
    statusCode: 201,
    headers: jsonHeaders,
    body: JSON.stringify(res.rows[0])
  }
}

async function updateTodo(event, user) {
  let data
  try {
    data = JSON.parse(event.body || '')
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    }
  }
  const { id, updates } = data
  if (!id || (typeof id !== 'string' && typeof id !== 'number') || typeof updates !== 'object' || Array.isArray(updates)) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing or invalid id/updates' })
    }
  }
  const allowed = ['content', 'completed', 'assigneeId']
  const setClauses = []
  const values = []
  for (const field of allowed) {
    if (field in updates) {
      const value = updates[field]
      if (field === 'content' && typeof value !== 'string') {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Invalid type for content' })
        }
      }
      if (field === 'completed' && typeof value !== 'boolean') {
        return {
          statusCode: 400,
          headers: jsonHeaders,
          body: JSON.stringify({ error: 'Invalid type for completed' })
        }
      }
      let column = field
      if (field === 'assigneeId') column = 'assignee_id'
      values.push(value)
      setClauses.push(`${column} = $${values.length}`)
    }
  }
  if (setClauses.length === 0) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'No valid fields to update' })
    }
  }
  values.push(id)
  values.push(user.id)
  const query = `
    UPDATE todos
    SET ${setClauses.join(', ')}, updated_at = now()
    WHERE id = $${values.length - 1} AND user_id = $${values.length}
    RETURNING
      id,
      node_id AS "nodeId",
      content,
      completed,
      assignee_id AS "assigneeId",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `
  const res = await client.query(query, values)
  const count = res.rowCount ?? 0
  if (count === 0) {
    return {
      statusCode: 404,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Todo not found' })
    }
  }
  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify(res.rows[0])
  }
}

async function deleteTodo(event, user) {
  let data
  try {
    data = JSON.parse(event.body || '')
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    }
  }
  const { id } = data
  if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Missing or invalid id' })
    }
  }
  const res = await client.query(
    `DELETE FROM todos
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [id, user.id]
  )
  const countDel = res.rowCount ?? 0
  if (countDel === 0) {
    return {
      statusCode: 404,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Todo not found' })
    }
  }
  return {
    statusCode: 200,
    headers: jsonHeaders,
    body: JSON.stringify({ id: res.rows[0].id })
  }
}