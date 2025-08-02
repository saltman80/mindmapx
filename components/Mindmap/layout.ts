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
  const MIN_NODE_GAP = 70
  const COLLISION_STEP = 50
  const SUBNODE_SPACING = 70

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

    if (depth === 0) {
      const baseRadius = Math.max(
        MIN_RADIUS,
        BASE_RADIUS - Math.max(0, depth - 1) * RADIUS_STEP
      )

      const parentAngle = 0
      let arc = Math.PI * 2
      let angleStep = total > 1 ? arc / (total - 1) : 0

      const minAngleForGap = 2 * Math.asin(MIN_SIBLING_GAP / (2 * baseRadius))
      if (total > 1 && angleStep < minAngleForGap) {
        const maxArc = Math.PI * 2
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
        resolveCollision(child, placed, MIN_NODE_GAP, COLLISION_STEP)
        placed.push(child)
        byId.set(child.id, child)
        queue.push({ node: child, depth: depth + 1 })
      })
      continue
    }

    const parent = node.parentId ? byId.get(node.parentId) : null
    const angle = parent
      ? Math.atan2((node.y ?? 0) - (parent.y ?? 0), (node.x ?? 0) - (parent.x ?? 0))
      : 0

    children.forEach((child, idx) => {
      const distance = SUBNODE_SPACING * (idx + 1)
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * distance)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * distance)
      resolveCollision(child, placed, MIN_NODE_GAP, COLLISION_STEP)
      placed.push(child)
      byId.set(child.id, child)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

function resolveCollision(
  node: LayoutNode,
  others: LayoutNode[],
  minGap: number,
  step: number
): void {
  let iterations = 0
  const maxIterations = 50
  const directions: Array<[number, number]> = [
    [step, 0],
    [0, step],
    [-step, 0],
    [0, -step],
    [step, step],
    [-step, step],
    [step, -step],
    [-step, -step],
  ]
  let dirIndex = 0

  while (iterations < maxIterations) {
    const hasCollision = others.some(o => {
      if (o === node) return false
      const dx = (node.x ?? 0) - (o.x ?? 0)
      const dy = (node.y ?? 0) - (o.y ?? 0)
      return Math.sqrt(dx * dx + dy * dy) < minGap
    })

    if (!hasCollision) break

    const [dx, dy] = directions[dirIndex]
    node.x = (node.x ?? 0) + dx
    node.y = (node.y ?? 0) + dy
    dirIndex = (dirIndex + 1) % directions.length
    iterations++
  }
}
