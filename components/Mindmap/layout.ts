export interface LayoutNode {
  id: string
  parentId: string | null
  x?: number
  y?: number
  children?: LayoutNode[]
}

export function assignPositions(root: LayoutNode): void {
  const MIN_SIBLING_GAP = 100
  const BASE_RADIUS = 200
  const RADIUS_STEP = 75
  const MAX_RADIUS = 350

  const byId = new Map<string, LayoutNode>()
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

    const baseRadius = Math.min(
      MAX_RADIUS,
      BASE_RADIUS + Math.max(0, depth - 1) * RADIUS_STEP
    )
    const isRoot = !node.parentId

    const parentAngle = isRoot
      ? 0
      : (() => {
          const parent = node.parentId ? byId.get(node.parentId) : null
          if (!parent) return 0
          return Math.atan2((node.y ?? 0) - (parent.y ?? 0), (node.x ?? 0) - (parent.x ?? 0))
        })()

    let arc = isRoot ? Math.PI * 2 : Math.PI / 2
    let angleStep = total > 1 ? arc / (total - 1) : 0

    const minAngleForGap = 2 * Math.asin(MIN_SIBLING_GAP / (2 * baseRadius))
    if (total > 1 && angleStep < minAngleForGap) {
      const maxArc = isRoot ? Math.PI * 2 : Math.PI
      arc = Math.min(maxArc, minAngleForGap * (total - 1))
      angleStep = arc / (total - 1)
    }

    const radius = Math.max(
      baseRadius,
      total > 1
        ? MIN_SIBLING_GAP / (2 * Math.sin(angleStep / 2))
        : baseRadius
    )

    const startAngle = total > 1 ? parentAngle - arc / 2 : parentAngle

    children.forEach((child, idx) => {
      const angle = startAngle + angleStep * idx
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * radius)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * radius)
      byId.set(child.id, child)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}
