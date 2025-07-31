import type { HandlerEvent, HandlerContext } from "@netlify/functions"
import { generateAIResponse } from './ai-generate.js'
import { createMindmapFromNodes } from './mindmaps.js'
import { requireAuth } from '../lib/auth.js'
import { checkAiLimit, logAiUsage } from "./usage-utils.js"
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
    ;({ userId } = requireAuth(event))
  } catch {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  if (!(await checkAiLimit(userId))) {
    return { statusCode: 429, body: 'AI limit reached' }
  }
  await logAiUsage(userId)

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
