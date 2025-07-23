import { getClient } from './db-client'

const buildResponse = (statusCode, payload) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }
  return { statusCode, headers, body: JSON.stringify(payload) }
}

async function createNode(data) {
  const client = await getClient()
  try {
    const res = await client.query(
      'INSERT INTO nodes(data) VALUES($1) RETURNING *',
      [data]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

async function updateNode(id, updates) {
  const client = await getClient()
  try {
    const res = await client.query(
      'UPDATE nodes SET data = data || $2 WHERE id = $1 RETURNING *',
      [id, updates]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

async function deleteNode(id) {
  const client = await getClient()
  try {
    const res = await client.query(
      'DELETE FROM nodes WHERE id = $1 RETURNING *',
      [id]
    )
    return res.rows[0]
  } finally {
    client.release()
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(204, {})
  }
  try {
    const method = event.httpMethod
    const params = event.queryStringParameters || {}
    let bodyData = null

    if (['POST', 'PUT'].includes(method)) {
      if (!event.body) {
        return buildResponse(400, { error: 'Missing request body' })
      }
      try {
        bodyData = JSON.parse(event.body)
      } catch {
        return buildResponse(400, { error: 'Malformed JSON' })
      }
    }

    switch (method) {
      case 'GET': {
        const client = await getClient()
        try {
          const res = await client.query('SELECT id, data, created_at FROM nodes')
          return buildResponse(200, { nodes: res.rows })
        } finally {
          client.release()
        }
      }
      case 'POST': {
        const { data } = bodyData
        if (data === undefined) {
          return buildResponse(400, { error: 'Missing data' })
        }
        if (typeof data !== 'object' || Array.isArray(data)) {
          return buildResponse(400, { error: 'Invalid data type' })
        }
        const node = await createNode(data)
        return buildResponse(201, { node })
      }
      case 'PUT': {
        const idParam = params.id
        if (!idParam) {
          return buildResponse(400, { error: 'Missing id' })
        }
        const id = parseInt(idParam, 10)
        if (isNaN(id)) {
          return buildResponse(400, { error: 'Invalid id' })
        }
        const { updates } = bodyData
        if (updates === undefined) {
          return buildResponse(400, { error: 'Missing updates' })
        }
        if (typeof updates !== 'object' || Array.isArray(updates)) {
          return buildResponse(400, { error: 'Invalid updates type' })
        }
        const node = await updateNode(id, updates)
        if (!node) {
          return buildResponse(404, { error: 'Node not found' })
        }
        return buildResponse(200, { node })
      }
      case 'DELETE': {
        const idParam = params.id
        if (!idParam) {
          return buildResponse(400, { error: 'Missing id' })
        }
        const id = parseInt(idParam, 10)
        if (isNaN(id)) {
          return buildResponse(400, { error: 'Invalid id' })
        }
        const node = await deleteNode(id)
        if (!node) {
          return buildResponse(404, { error: 'Node not found' })
        }
        return buildResponse(200, { node })
      }
      default:
        return buildResponse(405, { error: 'Method Not Allowed' })
    }
  } catch (error) {
    console.error(error)
    return buildResponse(500, { error: 'Internal Server Error' })
  }
}