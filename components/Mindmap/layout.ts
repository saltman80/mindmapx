export interface LayoutNode {
  id: string
  parentId: string | null
  x?: number
  y?: number
  /** Angle relative to root, used for placing descendants */
  angle?: number
  label?: string | null
  children?: LayoutNode[]
}

/**
 * Arrange nodes in a simple radial layout.
 * - Root children are spaced evenly around a circle.
 * - Deeper descendants fan out in a small arc from their parent.
 * The algorithm intentionally avoids collision detection to keep the
 * layout predictable and lightweight.
 */
export function assignPositions(root: LayoutNode): void {
  // Distances for root-level children alternate to provide more space
  const ROOT_RADII = [200, 400, 100, 400]
  const ROOT_VARIATION_MIN = 25
  const ROOT_VARIATION_MAX = 50

  const SUBNODE_DISTANCE_MIN = 75
  const SUBNODE_DISTANCE_VARIANCE = 25 // results in 75-100px from parent
  const SUBNODE_SEPARATION_MIN = 70
  const SUBNODE_SEPARATION_VARIANCE = 30 // siblings ~70-100px apart

  // place root at the origin – the canvas can translate it later
  root.x = 0
  root.y = 0
  root.angle = 0

  const queue: Array<{ node: LayoutNode; depth: number }> = [
    { node: root, depth: 0 }
  ]

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!
    const children = Array.isArray(node.children) ? node.children : []
    const total = children.length
    if (total === 0) continue

    if (depth === 0) {
      // Spread root-level children evenly, alternating their distance
      const angleStep = (Math.PI * 2) / total
      children.forEach((child, idx) => {
        const angle = angleStep * idx
        const baseRadius = ROOT_RADII[idx % ROOT_RADII.length]
        const variation =
          ROOT_VARIATION_MIN + Math.random() * (ROOT_VARIATION_MAX - ROOT_VARIATION_MIN)
        const radius = baseRadius + variation
        child.angle = angle
        child.x = Math.round(Math.cos(angle) * radius)
        child.y = Math.round(Math.sin(angle) * radius)
        queue.push({ node: child, depth: depth + 1 })
      })
      continue
    }

    const baseAngle = node.angle ?? 0
    const distance = SUBNODE_DISTANCE_MIN + Math.random() * SUBNODE_DISTANCE_VARIANCE
    const separation =
      SUBNODE_SEPARATION_MIN + Math.random() * SUBNODE_SEPARATION_VARIANCE
    const angleStep = total > 1 ? 2 * Math.asin(separation / (2 * distance)) : 0
    const start = baseAngle - (angleStep * (total - 1)) / 2

    children.forEach((child, idx) => {
      const jitter = (25 + Math.random() * 25) / distance
      const angle = start + angleStep * idx + (Math.random() - 0.5) * jitter
      child.angle = angle
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * distance)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * distance)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

