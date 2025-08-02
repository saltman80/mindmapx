import type { HandlerEvent, HandlerContext } from "@netlify/functions"
import { generateAIResponse } from './ai-generate.js'
import { createMindmapFromNodes } from './mindmaps.js'
import { requireAuth } from '../lib/auth.js'
import { checkAiLimit, logAiUsage } from "./usage-utils.js"
import { aiMindmapTreeSchema } from './validationschemas.js'
import { randomUUID } from 'crypto'

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

  const systemPrompt =
    'You are an AI that generates useful and structured mindmaps with a core concept and branching child nodes.'
  const userPrompt = `Create a JSON structure for a mind map.

Topic:
- Title: "${title}"
- Description: "${description}"

Instructions:
- Use the title and description as the root node (core concept).
- Add up to 8 child nodes, each with a title and description.
- Each child may contain 2–3 subnodes.
- Nest nodes using "children" arrays.
- Each node should only include: title, description, and children.

Example:
{
  "title": "Core Concept",
  "description": "Overview of the concept",
  "children": [
    {
      "title": "Child Node",
      "description": "Details about this aspect",
      "children": [
        {
          "title": "Subnode",
          "description": "Further explanation"
        }
      ]
    }
  ]
}

Return only valid JSON.`

  type TreeNode = { title: string; description?: string; children?: TreeNode[] }

  let flatNodes: Array<{ id: string; title: string; description?: string; parentId: string | null }> = []

  try {
    const content = await generateAIResponse(userPrompt, systemPrompt)
    const tree = aiMindmapTreeSchema.parse(JSON.parse(content)) as TreeNode
    tree.title = title
    tree.description = description

    const traverse = (node: TreeNode, parentId: string | null) => {
      const id = randomUUID()
      flatNodes.push({ id, title: node.title, description: node.description, parentId })
      for (const child of node.children || []) {
        traverse(child, id)
      }
    }

    traverse(tree, null)
  } catch (err) {
    console.error('AI parse failed:', err)
  }

  if (flatNodes.length === 0) {
    const id = randomUUID()
    flatNodes.push({ id, title, description, parentId: null })
  }

  try {
    const mindmapId = await createMindmapFromNodes(userId, title, description, flatNodes)
    return {
      statusCode: 200,
      body: JSON.stringify({ mindmapId })
    }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Internal Server Error' }
  }
}
