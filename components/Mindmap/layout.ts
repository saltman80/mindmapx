export interface LayoutNode {
  id: string
  parentId: string | null
  x?: number
  y?: number
  /** Directional angle from root used for clustering */
  angle?: number
  label?: string | null
  children?: LayoutNode[]
}

export function assignPositions(root: LayoutNode): void {
  // Distance of first layer of children from root
  const ROOT_RADIUS = 150
  // Additional distance for each successive layer of first-level children
  const ROOT_LAYER_GAP = 150
  // Sub-nodes hug their parent a bit closer
  const SUBNODE_RADIUS = 80
  // Tighter fan for sub-nodes so they cluster in the same direction
  const SUBNODE_ARC = Math.PI / 3 // 60° fan for sub-nodes
  const MIN_NODE_GAP = 120
  const COLLISION_STEP = 50

  const placed: LayoutNode[] = []
  const queue: Array<{ node: LayoutNode; depth: number }> = []

  root.x = 400
  root.y = 300
  root.angle = 0
  placed.push(root)
  queue.push({ node: root, depth: 0 })

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!
    const children = Array.isArray(node.children) ? node.children : []
    const total = children.length
    if (total === 0) continue

    if (depth === 0) {
      // Distribute first-level children across quadrants and layers
      const quadrants = [
        -3 * Math.PI / 4, // top-left
        -1 * Math.PI / 4, // top-right
        3 * Math.PI / 4, // bottom-left
        Math.PI / 4, // bottom-right
      ]
      children.forEach((child, idx) => {
        const quadrantIndex = idx % quadrants.length
        const layer = Math.floor(idx / quadrants.length)
        const angle = quadrants[quadrantIndex]
        const radius = ROOT_RADIUS + layer * ROOT_LAYER_GAP
        child.x = Math.round((node.x ?? 0) + Math.cos(angle) * radius)
        child.y = Math.round((node.y ?? 0) + Math.sin(angle) * radius)
        child.angle = angle
        const gap = Math.max(
          MIN_NODE_GAP,
          estimateLabelWidth(child.label) + 20
        )
        resolveCollision(child, placed, gap, COLLISION_STEP)
        placed.push(child)
        queue.push({ node: child, depth: depth + 1 })
      })
      continue
    }

    const baseAngle = node.angle ?? 0
    const arc = SUBNODE_ARC
    const angleStep = total > 1 ? arc / (total - 1) : 0
    const start = baseAngle - arc / 2

    children.forEach((child, idx) => {
      let angle = start + angleStep * idx
      // Small random jitter to avoid identical coordinates
      angle += (Math.random() - 0.5) * 0.1
      const radius = SUBNODE_RADIUS + idx * 20
      child.x = Math.round((node.x ?? 0) + Math.cos(angle) * radius)
      child.y = Math.round((node.y ?? 0) + Math.sin(angle) * radius)
      child.angle = angle
      const gap = Math.max(MIN_NODE_GAP, estimateLabelWidth(child.label) + 20)
      resolveCollision(child, placed, gap, COLLISION_STEP)
      placed.push(child)
      queue.push({ node: child, depth: depth + 1 })
    })
  }
}

function estimateLabelWidth(label?: string | null): number {
  return label ? label.length * 8 : 0
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
