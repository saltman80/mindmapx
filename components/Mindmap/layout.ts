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
  const ROOT_RADIUS = 200
  const SUBNODE_ARC = (20 * Math.PI) / 180 // 20° fan for sub-nodes
  const SUBNODE_DISTANCE = 70
  const SUBNODE_JITTER = 50

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
      // Spread root-level children evenly in all directions
      const angleStep = (Math.PI * 2) / total
      children.forEach((child, idx) => {
        const angle = angleStep * idx
        child.angle = angle
        child.x = Math.round(Math.cos(angle) * ROOT_RADIUS)
        child.y = Math.round(Math.sin(angle) * ROOT_RADIUS)
        queue.push({ node: child, depth: depth + 1 })
      })
      continue
    }

    const baseAngle = node.angle ?? 0
    const angleStep = total > 1 ? SUBNODE_ARC / (total - 1) : 0
    const start = baseAngle - SUBNODE_ARC / 2

    children.forEach((child, idx) => {
      const angle = start + angleStep * idx
      const distance = SUBNODE_DISTANCE + Math.random() * SUBNODE_JITTER
      child.angle = angle
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * distance)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * distance)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

