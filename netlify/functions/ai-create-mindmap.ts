import type { HandlerEvent, HandlerContext } from "@netlify/functions"
import { generateAIResponse } from './ai-generate.js'
import { createMindmapFromNodes } from './mindmaps.js'
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

  const prompt = `Create a mindmap JSON based on: "${description}". Return an array of nodes with fields: id, title, parentId.`

  let nodes: any[] = []
  try {
    const content = await generateAIResponse(prompt)
    nodes = aiMindmapNodesSchema.parse(JSON.parse(content))
  } catch (err) {
    console.error('AI parse failed:', err)
    nodes = []
  }

  try {
    const mindmapId = await createMindmapFromNodes(userId, title, description, nodes)
    return {
      statusCode: 200,
      body: JSON.stringify({ mindmapId })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
