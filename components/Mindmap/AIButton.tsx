import { useState } from 'react'
import LoadingSpinner from '../../loadingspinner'
import { callOpenRouterWithRetries } from '../../utils/openrouter'
import { getMonthlyUsage, trackAIUsage } from '../../lib/ai/usage'
import { useUser } from '../../src/lib/UserContext'

interface FlatMindmapNode {
  id: string
  title: string
  parentId: string | null
  mapId: string
  x: number
  y: number
}

export interface MindmapNode {
  id: string
  title: string
  parentId: string | null
  mapId: string
  children?: MindmapNode[]
  x?: number
  y?: number
}

export function buildMindmapFromJSON(data: MindmapNode, mapId: string): MindmapNode {
  function clone(node: MindmapNode): MindmapNode {
    return {
      id: node.id,
      title: node.title,
      parentId: node.parentId,
      mapId,
      x: node.x,
      y: node.y,
      children: Array.isArray(node.children) ? node.children.map(clone) : undefined,
    }
  }
  return clone(data)
}

function buildMindmapPrompt(topic: string): string {
  return `Create a valid JSON mindmap structure about "${topic}" with:
- One root node titled "My Mindmap".
- Up to 8 child nodes connected to the root.
- Each child node may have 1–3 subnodes.

Each node must include: id, title, parentId (null for root), and mapId = "TEMP_MAP_ID".

Return only valid JSON in tree format without code fences or quotes.`
}

function validateMindmapTree(root: any): asserts root is MindmapNode {
  const ids = new Set<string>()
  function walk(node: any, expectedParent: string | null, depth: number): void {
    if (!node || typeof node !== 'object') throw new Error('Node must be object')
    const { id, title, parentId, mapId, children } = node
    if (typeof id !== 'string' || typeof title !== 'string') throw new Error('Missing fields')
    if (expectedParent === null ? parentId !== null : parentId !== expectedParent) {
      throw new Error('parentId mismatch')
    }
    if (typeof mapId !== 'string') throw new Error('Missing mapId')
    if (ids.has(id)) throw new Error('Duplicate id')
    ids.add(id)
    if (children != null) {
      if (!Array.isArray(children)) throw new Error('Children must be array')
      if (depth === 0 && children.length > 8) throw new Error('Too many root children')
      if (depth === 1 && children.length > 3) throw new Error('Too many subnodes')
      for (const child of children) walk(child, id, depth + 1)
    }
  }
  walk(root, null, 0)
}

function assignPositions(root: MindmapNode): void {
  type Direction = 'tr' | 'br' | 'bl' | 'tl'
  const directionAngles: Record<Direction, number> = {
    tr: -Math.PI / 4,
    br: Math.PI / 4,
    bl: (3 * Math.PI) / 4,
    tl: (-3 * Math.PI) / 4,
  }
  const MIN_SIBLING_GAP = 100
  const BASE_DISTANCE = 200
  const DISTANCE_STEP = 150

  const byId = new Map<string, MindmapNode>()
  const getDirection = (node: MindmapNode): Direction => {
    if (!node.parentId) return 'tr'
    const parent = byId.get(node.parentId)
    if (!parent) return 'tr'
    const dx = (node.x ?? 0) - (parent.x ?? 0)
    const dy = (node.y ?? 0) - (parent.y ?? 0)
    if (dx >= 0 && dy <= 0) return 'tr'
    if (dx >= 0 && dy > 0) return 'br'
    if (dx < 0 && dy > 0) return 'bl'
    return 'tl'
  }

  const queue: Array<{ node: MindmapNode; depth: number }> = []
  root.x = 400
  root.y = 300
  byId.set(root.id, root)
  queue.push({ node: root, depth: 0 })

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!
    const children = Array.isArray(node.children) ? node.children : []
    const total = children.length
    if (total === 0) continue

    const baseRadius = BASE_DISTANCE + depth * DISTANCE_STEP
    const isRoot = !node.parentId
    const baseArc = isRoot ? Math.PI * 2 : Math.PI
    let arc = baseArc
    let angleStep = arc / total

    const minAngleForGap = 2 * Math.asin(MIN_SIBLING_GAP / (2 * baseRadius))
    if (angleStep < minAngleForGap) {
      const maxArc = isRoot ? Math.PI * 2 : (Math.PI * 3) / 2
      arc = Math.min(maxArc, minAngleForGap * total)
      angleStep = arc / total
    }

    const radius = Math.max(
      baseRadius,
      MIN_SIBLING_GAP / (2 * Math.sin(angleStep / 2))
    )

    const centerAngle = isRoot ? 0 : directionAngles[getDirection(node)]
    const startAngle = centerAngle - arc / 2

    children.forEach((child, idx) => {
      const angle = startAngle + angleStep * (idx + 0.5)
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * radius)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * radius)
      byId.set(child.id, child)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

function flattenMindmapTree(node: MindmapNode, mapId: string, parentId: string | null = null): FlatMindmapNode[] {
  const flat: FlatMindmapNode[] = []
  flat.push({
    id: node.id,
    title: node.title,
    parentId,
    mapId,
    x: node.x ?? 0,
    y: node.y ?? 0,
  })

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      flat.push(...flattenMindmapTree(child, mapId, node.id))
    }
  }

  return flat
}

async function createNewMindmap(title: string): Promise<string> {
  const res = await fetch('/.netlify/functions/mindmaps', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: { title, description: '' } }),
  })
  const json = await res.json()
  if (!res.ok || typeof json?.id !== 'string') throw new Error('Mindmap creation failed')
  return json.id
}

async function createMindmapNode(node: FlatMindmapNode, idMap: Map<string, string>): Promise<string> {
  const parentDbId = node.parentId ? idMap.get(node.parentId) ?? null : null
  const res = await fetch('/.netlify/functions/nodes', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mindmapId: node.mapId,
      x: node.x,
      y: node.y,
      label: node.title,
      description: '',
      parentId: parentDbId,
      linkedTodoListId: null,
    }),
  })
  const json = await res.json()
  if (!res.ok || typeof json?.id !== 'string') throw new Error('Failed to create node')
  idMap.set(node.id, json.id)
  return json.id
}

interface AIButtonProps {
  topic: string
  onGenerate: (data: MindmapNode) => void
}

export default function AIButton({ topic, onGenerate }: AIButtonProps): JSX.Element {
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  const handleClick = async () => {
    if (!user?.id) {
      alert('You must be logged in to use AI features.')
      return
    }

    setLoading(true)
    try {
      const usage = await getMonthlyUsage(user.id, 'mindmap')
      if (usage >= 25) {
        alert("You've hit your monthly AI limit for mindmaps.")
        return
      }

      const prompt = buildMindmapPrompt(topic)
      const response = await callOpenRouterWithRetries(prompt)
      if (!response) {
        alert('AI failed after 3 attempts.')
        return
      }

      let rootNode: MindmapNode
      try {
        rootNode = JSON.parse(response)
        validateMindmapTree(rootNode)
      } catch {
        alert('Invalid mindmap format returned by AI.')
        return
      }

      const mapId = await createNewMindmap('AI Generated Map')
      assignPositions(rootNode)
      const allNodes = flattenMindmapTree(rootNode, mapId)
      const idMap = new Map<string, string>()
      for (const node of allNodes) {
        await createMindmapNode(node, idMap)
      }

      await trackAIUsage(user.id, 'mindmap')
      onGenerate(buildMindmapFromJSON(rootNode, mapId))
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Mindmap generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button className="btn-primary" onClick={handleClick} disabled={loading}>
        {loading ? <LoadingSpinner size={16} /> : 'Create with AI'}
      </button>
    </div>
  )
}
