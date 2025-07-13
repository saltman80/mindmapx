const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/

async function getMindmap(mapId) {
  const { rows } = await client.query('SELECT * FROM mindmaps WHERE id = $1', [mapId])
  return rows[0] || null
}

export const handler = async (event) => {
  const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { ...headers, Allow: 'GET' },
      body: JSON.stringify({ error: `Method ${event.httpMethod} Not Allowed` })
    }
  }

  const mapId = event.queryStringParameters?.mapId
  if (!mapId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing mapId parameter' })
    }
  }

  if (!/^\d+$/.test(mapId) && !UUID_REGEX.test(mapId)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid mapId format' })
    }
  }

  try {
    const mindmap = await getMindmap(mapId)
    if (!mindmap) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Mindmap not found' })
      }
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mindmap)
    }
  } catch (error) {
    console.error('Error fetching mindmap:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
}