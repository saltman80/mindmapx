export interface LayoutNode {
  id: string
  parentId: string | null
  x?: number
  y?: number
  children?: LayoutNode[]
}

export function assignPositions(root: LayoutNode): void {
  const MIN_SIBLING_GAP = 100
  const BASE_RADIUS = 150
  const RADIUS_STEP = 30
  const MIN_RADIUS = 80
  const MIN_NODE_GAP = 100
  const COLLISION_STEP = 20

  const byId = new Map<string, LayoutNode>()
  const placed: LayoutNode[] = []
  const queue: Array<{ node: LayoutNode; depth: number }> = []
  root.x = 400
  root.y = 300
  byId.set(root.id, root)
  placed.push(root)
  queue.push({ node: root, depth: 0 })

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!
    const children = Array.isArray(node.children) ? node.children : []
    const total = children.length
    if (total === 0) continue

    const baseRadius = Math.max(
      MIN_RADIUS,
      BASE_RADIUS - Math.max(0, depth - 1) * RADIUS_STEP
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
      resolveCollision(child, placed, node, MIN_NODE_GAP, COLLISION_STEP, MIN_RADIUS)
      placed.push(child)
      byId.set(child.id, child)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

function resolveCollision(
  node: LayoutNode,
  others: LayoutNode[],
  parent: LayoutNode,
  minGap: number,
  step: number,
  minRadius: number
): void {
  const px = parent.x ?? 0
  const py = parent.y ?? 0
  let angle = Math.atan2((node.y ?? 0) - py, (node.x ?? 0) - px)
  let radius = Math.sqrt(
    Math.pow((node.x ?? 0) - px, 2) + Math.pow((node.y ?? 0) - py, 2)
  )

  let iterations = 0
  const maxIterations = 50

  while (iterations < maxIterations) {
    const hasCollision = others.some(o => {
      if (o === node) return false
      const dx = (node.x ?? 0) - (o.x ?? 0)
      const dy = (node.y ?? 0) - (o.y ?? 0)
      return Math.sqrt(dx * dx + dy * dy) < minGap
    })

    if (!hasCollision) break

    radius = Math.max(minRadius, radius - step)
    node.x = Math.round(px + Math.cos(angle) * radius)
    node.y = Math.round(py + Math.sin(angle) * radius)
    iterations++
  }
}
