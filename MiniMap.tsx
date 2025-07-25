import React from 'react'
import type { NodeData, EdgeData } from './mindmapTypes'

const CANVAS_SIZE = 50 * 500
const MINIMAP_SIZE = 150

interface MiniMapProps {
  nodes: NodeData[]
  edges: EdgeData[]
  transform: { x: number; y: number; k: number }
  onNavigate: (x: number, y: number) => void
}

const MiniMap: React.FC<MiniMapProps> = ({ nodes, edges, transform, onNavigate }) => {
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const safeEdges = Array.isArray(edges) ? edges : []
  const scale = MINIMAP_SIZE / CANVAS_SIZE

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale
    onNavigate(x, y)
  }

  const viewX = -transform.x / transform.k
  const viewY = -transform.y / transform.k
  const viewW = MINIMAP_SIZE / transform.k
  const viewH = MINIMAP_SIZE / transform.k

  return (
    <svg
      width={MINIMAP_SIZE}
      height={MINIMAP_SIZE}
      style={{ position: 'absolute', right: 10, bottom: 10, background: '#fff', border: '1px solid #ccc' }}
      onPointerDown={handlePointerDown}
    >
      <g transform={`scale(${scale})`}>
        {Array.isArray(safeEdges) && safeEdges.map(edge => {
          const from = safeNodes.find(n => n.id === edge.from)
          const to = safeNodes.find(n => n.id === edge.to)
          if (!from || !to) return null
          return (
            <path
              key={edge.id}
              d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${(from.y + to.y) / 2 - 40} ${to.x},${to.y}`}
              fill="none"
              stroke="#ccc"
              strokeWidth={1}
            />
          )
        })}
        {Array.isArray(safeNodes) && safeNodes.map(node => (
          <circle key={node.id} cx={node.x} cy={node.y} r={5} fill="orange" />
        ))}
      </g>
      <rect
        x={viewX * scale}
        y={viewY * scale}
        width={viewW}
        height={viewH}
        fill="none"
        stroke="red"
        strokeWidth={1}
      />
    </svg>
  )
}

export default MiniMap
