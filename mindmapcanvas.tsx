import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useEffect
} from 'react'
import MiniMap from './MiniMap'
import type { NodeData, EdgeData } from './mindmapTypes'

const DOT_SPACING = 50
const GRID_SIZE = 500
const CANVAS_SIZE = DOT_SPACING * GRID_SIZE

interface MindmapCanvasProps {
  nodes?: NodeData[]
  edges?: EdgeData[]
  width?: number | string
  height?: number | string
  onAddNode?: (node: NodeData) => void
  onMoveNode?: (node: NodeData) => void
  showMiniMap?: boolean
}

interface MindmapCanvasHandle {
  pan: (dx: number, dy: number) => void
  zoom: (scale: number, cx?: number, cy?: number) => void
  addNode: (node: NodeData) => void
  updateNode: (node: NodeData) => void
  removeNode: (nodeId: string) => void
}

const MindmapCanvas = forwardRef<MindmapCanvasHandle, MindmapCanvasProps>(
  (
    {
      nodes: propNodes = [],
      edges: propEdges = [],
      width,
      height,
      onAddNode,
      onMoveNode,
      showMiniMap = false,
    },
    ref
  ) => {
    const safePropNodes = Array.isArray(propNodes) ? propNodes : []
    const safePropEdges = Array.isArray(propEdges) ? propEdges : []

    const [nodes, setNodes] = useState<NodeData[]>(() => safePropNodes)
    const [edges, setEdges] = useState<EdgeData[]>(() => safePropEdges)

    const safeNodes = Array.isArray(nodes) ? nodes : []
    const safeEdges = Array.isArray(edges) ? edges : []
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [showCreate, setShowCreate] = useState(false)

    useEffect(() => {
      if (Array.isArray(nodes) && nodes.length === 0) {
        setShowCreate(true)
      }
    }, [nodes])
    const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [todoNodeId, setTodoNodeId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [todoLists, setTodoLists] = useState<Record<string, { id: string; text: string; done: boolean }[]>>({})
  const modeRef = useRef<'canvas' | 'node' | null>(null)
    const dragStartRef = useRef({ x: 0, y: 0 })
    const originRef = useRef({ x: 0, y: 0 })
    const dragNodeIdRef = useRef<string | null>(null)
  const nodeOriginRef = useRef<{ x: number; y: number } | null>(null)
  const pinchRef = useRef<{
    initialDistance: number
    initialCenter: { x: number; y: number }
    initialTransform: { x: number; y: number; k: number }
  } | null>(null)


    const pan = useCallback((dx: number, dy: number) => {
      console.log('[MindmapCanvas] pan', dx, dy)
      setTransform(prev => ({ x: prev.x + dx, y: prev.y + dy, k: prev.k }))
    }, [])

    const zoom = useCallback(
      (scale: number, centerX = 0, centerY = 0) => {
        console.log('[MindmapCanvas] zoom', scale, centerX, centerY)
        setTransform(prev => {
          const newK = prev.k * scale
          const x = (prev.x - centerX) * scale + centerX
          const y = (prev.y - centerY) * scale + centerY
          return { x, y, k: newK }
        })
      },
      []
    )

    const addNode = useCallback((node: NodeData) => {
      console.log('[MindmapCanvas] addNode', node)
      setNodes(prev => [...prev, node])
      if (node.parentId) {
        const edgeId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        const edge: EdgeData = { id: edgeId, from: node.parentId, to: node.id }
        setEdges(prev => [...prev, edge])
      }
    }, [])

    const handleSaveNew = useCallback(() => {
      console.log('[MindmapCanvas] handleSaveNew')
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = CANVAS_SIZE / 2
      const y = CANVAS_SIZE / 2
      const tx = rect.width / 2 - x
      const ty = rect.height / 2 - y
      setTransform({ x: tx, y: ty, k: 1 })
      const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
      const node: NodeData = {
        id,
        x,
        y,
        label: newName || 'Root Node',
        description: newDesc || undefined,
        parentId: null,
        todoId: null,
      }
      addNode(node)
      onAddNode && onAddNode(node)
      setShowCreate(false)
      setNewName('')
      setNewDesc('')
    }, [addNode, onAddNode, newName, newDesc])

    const handleAddChild = useCallback(() => {
      console.log('[MindmapCanvas] handleAddChild')
      if (!addParentId) return
      const parent = safeNodes.find(n => n.id === addParentId)
      if (!parent) {
        setAddParentId(null)
        return
      }
      const siblingCount = safeNodes.filter(n => n.parentId === addParentId).length
      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      const node: NodeData = {
        id,
        x: parent.x + 150,
        y: parent.y + 50 * (siblingCount + 1),
        label: newName || 'New Node',
        description: newDesc || undefined,
        parentId: addParentId,
        todoId: null,
      }
      addNode(node)
      onAddNode && onAddNode(node)
      setAddParentId(null)
      setNewName('')
      setNewDesc('')
    }, [addParentId, addNode, Array.isArray(nodes) ? nodes : [], newName, newDesc, onAddNode])

    const openEditModal = useCallback((id: string) => {
      console.log('[MindmapCanvas] openEditModal', id)
      const node = safeNodes.find(n => n.id === id)
      if (!node) return
      setEditingId(id)
      setEditTitle(node.label || '')
      setEditDesc(node.description || '')
    }, [Array.isArray(nodes) ? nodes : []])

    const handleSaveEdit = useCallback(() => {
      console.log('[MindmapCanvas] handleSaveEdit')
      if (!editingId) return
      const node = safeNodes.find(n => n.id === editingId)
      if (!node) return
      const updated = { ...node, label: editTitle, description: editDesc }
      updateNode(updated)
      setEditingId(null)
      setEditTitle('')
      setEditDesc('')
    }, [editingId, editTitle, editDesc, Array.isArray(nodes) ? nodes : [], updateNode])

    const handleDeleteNode = useCallback((id: string) => {
      console.log('[MindmapCanvas] handleDeleteNode', id)
      if (!window.confirm('Are you sure you want to delete this node?')) return
      removeNode(id)
    }, [removeNode])

    const handleAddTask = useCallback(() => {
      console.log('[MindmapCanvas] handleAddTask for', todoNodeId)
      if (!todoNodeId) return
      const text = newTask.trim()
      if (!text) return
      const taskId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      setTodoLists(prev => {
        const list = prev[todoNodeId] ?? []
        return { ...prev, [todoNodeId]: [...list, { id: taskId, text, done: false }] }
      })
      setNewTask('')
    }, [todoNodeId, newTask])

    const handleToggleTask = useCallback((taskId: string) => {
      console.log('[MindmapCanvas] handleToggleTask', taskId)
      if (!todoNodeId) return
      setTodoLists(prev => {
        const list = prev[todoNodeId] ?? []
        return {
          ...prev,
          [todoNodeId]: list.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
        }
      })
    }, [todoNodeId])

    const handleDeleteTask = useCallback((taskId: string) => {
      console.log('[MindmapCanvas] handleDeleteTask', taskId)
      if (!todoNodeId) return
      setTodoLists(prev => {
        const list = prev[todoNodeId] ?? []
        return { ...prev, [todoNodeId]: list.filter(t => t.id !== taskId) }
      })
    }, [todoNodeId])

    const updateNode = useCallback((node: NodeData) => {
      console.log('[MindmapCanvas] updateNode', node)
      setNodes(prev => prev.map(n => (n.id === node.id ? { ...n, ...node } : n)))
    }, [])

    const removeNode = useCallback((nodeId: string) => {
      console.log('[MindmapCanvas] removeNode', nodeId)
      setNodes(prev => prev.filter(n => n.id !== nodeId))
      setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId))
    }, [])

    useImperativeHandle(
      ref,
      () => ({ pan, zoom, addNode, updateNode, removeNode }),
      [pan, zoom, addNode, updateNode, removeNode]
    )

    const nodeMap = useMemo(() => {
      const map = new Map<string, NodeData>()
      const arr = Array.isArray(nodes) ? nodes : []
      arr.forEach(n => map.set(n.id, n))
      return map
    }, [Array.isArray(nodes) ? nodes : []])

    console.log('[MindmapCanvas] rendering with nodes:', nodes, 'edges:', edges)

    const handlePointerMove = useCallback(
      (e: PointerEvent) => {
        console.log('[MindmapCanvas] handlePointerMove')
        if (!modeRef.current) return
        e.preventDefault()
        const dx = e.clientX - dragStartRef.current.x
        const dy = e.clientY - dragStartRef.current.y
        if (modeRef.current === 'canvas') {
          setTransform({
            x: originRef.current.x + dx,
            y: originRef.current.y + dy,
            k: transform.k,
          })
        } else if (
          modeRef.current === 'node' &&
          dragNodeIdRef.current &&
          nodeOriginRef.current
        ) {
          const scaledDx = dx / transform.k
          const scaledDy = dy / transform.k
          setNodes(prev =>
            prev.map(n =>
              n.id === dragNodeIdRef.current
                ? { ...n, x: nodeOriginRef.current!.x + scaledDx, y: nodeOriginRef.current!.y + scaledDy }
                : n
            )
          )
        }
      },
      [transform.k]
    )

    const handlePointerUp = useCallback(
      (e: PointerEvent) => {
        console.log('[MindmapCanvas] handlePointerUp')
        if (modeRef.current === 'node' && dragNodeIdRef.current) {
          const node = safeNodes.find(n => n.id === dragNodeIdRef.current)
          if (node && onMoveNode) onMoveNode(node)
        }
        modeRef.current = null
        dragNodeIdRef.current = null
        nodeOriginRef.current = null
        svgRef.current?.releasePointerCapture(e.pointerId)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      },
      [Array.isArray(nodes) ? nodes : [], onMoveNode, handlePointerMove]
    )

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<SVGSVGElement>) => {
        console.log('[MindmapCanvas] handlePointerDown')
        if ((e.target as HTMLElement).closest('.add-child-button')) return
        const target = (e.target as HTMLElement).closest('.mindmap-node') as HTMLElement | null
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        if (target) {
          const id = target.getAttribute('data-id')
          if (!id) return
          modeRef.current = 'node'
          dragNodeIdRef.current = id
          const node = safeNodes.find(n => n.id === id)
          if (node) nodeOriginRef.current = { x: node.x, y: node.y }
        } else {
          modeRef.current = 'canvas'
          originRef.current = { x: transform.x, y: transform.y }
        }
        svgRef.current?.setPointerCapture(e.pointerId)
        window.addEventListener('pointermove', handlePointerMove)
        window.addEventListener('pointerup', handlePointerUp)
      },
      [Array.isArray(nodes) ? nodes : [], transform, handlePointerMove, handlePointerUp]
    )

    useEffect(() => {
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }, [handlePointerMove, handlePointerUp])

    const handleWheel = useCallback(
      (e: React.WheelEvent<SVGSVGElement>) => {
        console.log('[MindmapCanvas] handleWheel', e.deltaY)
        e.preventDefault()
        if (!svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const scale = e.deltaY < 0 ? 1.1 : 0.9
        zoom(scale, cx, cy)
      },
      [zoom]
    )

    // touch handlers kept for pinch-zoom support

    const handleTouchStart = useCallback(
      (e: React.TouchEvent<SVGSVGElement>) => {
        console.log('[MindmapCanvas] handleTouchStart')
        if (!svgRef.current) return
        if (e.touches.length === 1) {
          e.preventDefault()
          modeRef.current = 'canvas'
          dragStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
          originRef.current = { x: transform.x, y: transform.y }
        } else if (e.touches.length === 2) {
          e.preventDefault()
          const rect = svgRef.current.getBoundingClientRect()
          const t1 = e.touches[0]
          const t2 = e.touches[1]
          const x1 = t1.clientX - rect.left
          const y1 = t1.clientY - rect.top
          const x2 = t2.clientX - rect.left
          const y2 = t2.clientY - rect.top
          const dx = x2 - x1
          const dy = y2 - y1
          const initialDistance = Math.hypot(dx, dy)
          const centerX = (x1 + x2) / 2
          const centerY = (y1 + y2) / 2
          pinchRef.current = {
            initialDistance,
            initialCenter: { x: centerX, y: centerY },
            initialTransform: { ...transform }
          }
        }
      },
      [transform]
    )

    const handleTouchMove = useCallback(
      (e: React.TouchEvent<SVGSVGElement>) => {
        console.log('[MindmapCanvas] handleTouchMove')
        if (!svgRef.current) return
        if (e.touches.length === 1 && modeRef.current === 'canvas') {
          e.preventDefault()
          const touch = e.touches[0]
          const dx = touch.clientX - dragStartRef.current.x
          const dy = touch.clientY - dragStartRef.current.y
          setTransform({ x: originRef.current.x + dx, y: originRef.current.y + dy, k: transform.k })
        } else if (e.touches.length === 2 && pinchRef.current) {
          e.preventDefault()
          const rect = svgRef.current.getBoundingClientRect()
          const t1 = e.touches[0]
          const t2 = e.touches[1]
          const x1 = t1.clientX - rect.left
          const y1 = t1.clientY - rect.top
          const x2 = t2.clientX - rect.left
          const y2 = t2.clientY - rect.top
          const dx = x2 - x1
          const dy = y2 - y1
          const distance = Math.hypot(dx, dy)
          const { initialDistance, initialCenter, initialTransform } = pinchRef.current
          const scaleFactor = distance / initialDistance
          const cx = initialCenter.x
          const cy = initialCenter.y
          const { x: ix, y: iy, k: ik } = initialTransform
          const newK = ik * scaleFactor
          const newX = (ix - cx) * scaleFactor + cx
          const newY = (iy - cy) * scaleFactor + cy
          setTransform({ x: newX, y: newY, k: newK })
        }
      },
      [transform.k]
    )

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      console.log('[MindmapCanvas] handleTouchEnd')
      if (e.touches.length < 1) {
        modeRef.current = null
      }
      if (e.touches.length < 2) {
        pinchRef.current = null
      }
    }, [])


    const containerWidth =
      typeof width === 'number'
        ? `${width}px`
        : width ?? '100vw'
    const containerHeight =
      typeof height === 'number'
        ? `${height}px`
        : height ?? '100vh'

    return (
      <div
        ref={containerRef}
        style={{
          width: containerWidth,
          height: containerHeight,
          overflow: 'auto',
          touchAction: 'none',
          position: 'relative',
          cursor:
            safeNodes.length === 0 && safeEdges.length === 0
              ? 'pointer'
              : 'default'
        }}
      >
        <svg
          ref={svgRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <pattern
              id="dot-grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#FF6A00" />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#dot-grid)" />
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            {Array.isArray(safeEdges) && safeEdges.map(edge => {
              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null
              return (
                <path
                  key={edge.id}
                  d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${
                    (from.y + to.y) / 2 - 40
                  } ${to.x},${to.y}`}
                  fill="none"
                  stroke="#888"
                  strokeWidth={2 / transform.k}
                />
              )
            })}
            {Array.isArray(safeNodes) && safeNodes.map(node => (
              <g
                key={node.id}
                className="mindmap-node"
                data-id={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(h => (h === node.id ? null : h))}
              >
                <circle
                  r={20 / transform.k}
                  fill="#fff"
                  stroke="#000"
                  strokeWidth={2 / transform.k}
                />
                {node.label && (
                  <text
                    textAnchor="middle"
                    dy=".35em"
                    fontSize={14 / transform.k}
                  pointerEvents="none"
                >
                  {node.label}
                </text>
              )}
              {todoLists[node.id]?.length ? (
                <text
                  fontSize={12 / transform.k}
                  x={14 / transform.k}
                  y={14 / transform.k}
                >
                  ✓
                </text>
              ) : null}
              {hoveredId === node.id && (
                <g
                  className="hover-panel"
                  transform={`translate(${20 / transform.k},${-20 / transform.k})`}
                  onPointerDown={e => e.stopPropagation()}
                >
                  <g
                    transform="translate(0,0)"
                    onClick={e => {
                      e.stopPropagation()
                      setHoveredId(null)
                      setAddParentId(node.id)
                      setNewName('')
                      setNewDesc('')
                    }}
                  >
                    <circle r={8 / transform.k} fill="orange" stroke="#000" strokeWidth={1 / transform.k} />
                    <text textAnchor="middle" dy=".35em" fontSize={10 / transform.k} pointerEvents="none">+</text>
                  </g>
                  <g
                    transform={`translate(${18 / transform.k},0)`}
                    onClick={e => {
                      e.stopPropagation()
                      setHoveredId(null)
                      openEditModal(node.id)
                    }}
                  >
                    <circle r={8 / transform.k} fill="orange" stroke="#000" strokeWidth={1 / transform.k} />
                    <text textAnchor="middle" dy=".35em" fontSize={10 / transform.k} pointerEvents="none">✏️</text>
                  </g>
                  <g
                    transform={`translate(${36 / transform.k},0)`}
                    onClick={e => {
                      e.stopPropagation()
                      setHoveredId(null)
                      handleDeleteNode(node.id)
                    }}
                  >
                    <circle r={8 / transform.k} fill="orange" stroke="#000" strokeWidth={1 / transform.k} />
                    <text textAnchor="middle" dy=".35em" fontSize={10 / transform.k} pointerEvents="none">🗑️</text>
                  </g>
                  <g
                    transform={`translate(${54 / transform.k},0)`}
                    onClick={e => {
                      e.stopPropagation()
                      setHoveredId(null)
                      setTodoNodeId(node.id)
                    }}
                  >
                    <circle r={8 / transform.k} fill="orange" stroke="#000" strokeWidth={1 / transform.k} />
                    <text textAnchor="middle" dy=".35em" fontSize={10 / transform.k} pointerEvents="none">✓</text>
                  </g>
                </g>
              )}
              </g>
            ))}
          </g>
        </svg>
        <div
          className="zoom-controls"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            zIndex: 10,
          }}
        >
          <button type="button" onClick={() => zoom(1.1)}>+</button>
          <button type="button" onClick={() => zoom(0.9)}>-</button>
        </div>
        {safeNodes.length === 0 && safeEdges.length === 0 && !showCreate && (
          <div className="modal-overlay empty-canvas-modal">
            <div className="modal">
              <p>No nodes yet. Click below to start building your map!</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowCreate(true)}
              >
                Create Map Node
              </button>
            </div>
          </div>
        )}

        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Create Map Node</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
                <button className="btn-primary" onClick={handleSaveNew}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {addParentId && (
          <div className="modal-overlay" onClick={() => setAddParentId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Add Child Node</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
                <button className="btn-primary" onClick={handleAddChild}>
                  Add Node
                </button>
              </div>
            </div>
          </div>
        )}
        {editingId && (
          <div className="modal-overlay" onClick={() => setEditingId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Edit Node</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Title"
                />
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  placeholder="Notes"
                />
                <button className="btn-primary" onClick={handleSaveEdit}>Save</button>
              </div>
            </div>
          </div>
        )}
        {todoNodeId && (
          <div className="modal-overlay" onClick={() => setTodoNodeId(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>To-Do List</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="New task"
                />
                <button onClick={handleAddTask}>Add</button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {Array.isArray(todoLists[todoNodeId]) &&
                  todoLists[todoNodeId]!.map(t => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <input type="checkbox" checked={t.done} onChange={() => handleToggleTask(t.id)} />
                    <span style={{ textDecoration: t.done ? 'line-through' : 'none', flexGrow: 1 }}>{t.text}</span>
                    <button onClick={() => handleDeleteTask(t.id)}>x</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {showMiniMap && (
          <MiniMap
            nodes={safeNodes}
            edges={safeEdges}
            transform={transform}
            onNavigate={(x, y) => {
              console.log('[MindmapCanvas] MiniMap navigate', x, y)
              if (!containerRef.current) return
              const cw = containerRef.current.clientWidth
              const ch = containerRef.current.clientHeight
              setTransform(prev => ({
                x: cw / 2 - x * prev.k,
                y: ch / 2 - y * prev.k,
                k: prev.k,
              }))
            }}
          />
        )}
      </div>
    )
  }
)

MindmapCanvas.displayName = 'MindmapCanvas'

export type { NodeData, EdgeData } from './mindmapTypes'
export default MindmapCanvas
