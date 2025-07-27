import type { HandlerEvent, HandlerContext } from "@netlify/functions"
import { randomUUID } from 'crypto'
import { getClient } from './db-client.js'
import { generateAIResponse } from './ai-generate.js'
import { requireAuth } from './middleware.js'
import { aiMindmapNodesSchema } from './validationschemas.js'

export const handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  if (!event.body) return { statusCode: 400, body: 'Missing body' }

  let userId: string
  try {
    userId = await requireAuth(event)
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  let data: any
  try { data = JSON.parse(event.body) } catch { return { statusCode: 400, body: 'Invalid JSON' } }

  const { title, description = '' } = data
  if (typeof title !== 'string' || !title.trim()) return { statusCode: 400, body: 'Invalid title' }
  if (!description) return { statusCode: 400, body: 'Missing description' }

  const prompt = `Generate a mindmap as JSON from: "${description}". Limit to 40 nodes or fewer and include one root node with child and sub nodes. Each node should have fields id (uuid), title, and parentId (uuid or null). Return only valid JSON.\nExample:\n[{"id":"uuid","title":"Root","parentId":null},{"id":"uuid","title":"Child","parentId":"root-uuid"}]`

  let nodes: any[] = []
  try {
    const content = await generateAIResponse(prompt)
    nodes = aiMindmapNodesSchema.parse(JSON.parse(content))
  } catch (err) {
    console.error('AI parse failed:', err)
    nodes = []
  }

  const client = await getClient()
  try {
    await client.query('BEGIN')
    const res = await client.query(
      `INSERT INTO mindmaps(user_id, title, description, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [userId, title.trim(), description.trim() || null]
    )
    const mapId = res.rows[0].id
    for (const n of nodes) {
      await client.query(
        `INSERT INTO nodes(id, mindmap_id, parent_id, data)
         VALUES ($1,$2,$3,$4)`,
        [n.id || randomUUID(), mapId, n.parentId ?? null, JSON.stringify({ content: n.title })]
      )
    }
    await client.query('COMMIT')
    return { statusCode: 201, body: JSON.stringify({ id: mapId }) }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  } finally {
    client.release()
  }
}
