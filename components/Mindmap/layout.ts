export interface LayoutNode {
  id: string
  parentId: string | null
  x?: number
  y?: number
  children?: LayoutNode[]
}

export function assignPositions(root: LayoutNode): void {
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

  const byId = new Map<string, LayoutNode>()
  const getDirection = (node: LayoutNode): Direction => {
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

  const queue: Array<{ node: LayoutNode; depth: number }> = []
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
