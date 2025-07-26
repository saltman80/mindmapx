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
import { authFetch } from './authFetch'

const DOT_SPACING = 50
const GRID_SIZE = 500
const CANVAS_SIZE = DOT_SPACING * GRID_SIZE
const TOOL_OFFSET_X = 0
const TOOL_OFFSET_Y = -40

interface MindmapCanvasProps {
  nodes?: NodeData[]
  edges?: EdgeData[]
  width?: number | string
  height?: number | string
  onAddNode?: (node: NodeData) => void
  onMoveNode?: (node: NodeData) => void
  initialTransform?: { x: number; y: number; k: number }
  onTransformChange?: (t: { x: number; y: number; k: number }) => void
  showMiniMap?: boolean
  mindmapId: string
}

interface MindmapCanvasHandle {
  pan: (dx: number, dy: number) => void
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
      initialTransform = { x: 0, y: 0, k: 1 },
      onTransformChange,
      showMiniMap = false,
      mindmapId,
    },
    ref
  ) => {
    const safePropNodes = Array.isArray(propNodes) ? propNodes : []
    const safePropEdges = Array.isArray(propEdges) ? propEdges : []

    const [nodes, setNodes] = useState<NodeData[]>(() => safePropNodes)
    const [edges, setEdges] = useState<EdgeData[]>(() => safePropEdges)

    const safeNodes = Array.isArray(nodes) ? nodes : []
    const safeEdges = Array.isArray(edges) ? edges : []
    const [transform, setTransform] = useState<{ x: number; y: number; k: number }>(
      () => initialTransform
    )

    useEffect(() => {
      setTransform(initialTransform)
    }, [initialTransform])
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [showCreate, setShowCreate] = useState(false)

    useEffect(() => {
      setNodes(safePropNodes)
    }, [propNodes])

    useEffect(() => {
      setEdges(safePropEdges)
    }, [propEdges])

    useEffect(() => {
      if (Array.isArray(nodes) && nodes.length === 0) {
        setShowCreate(true)
      }
    }, [nodes])

    useEffect(() => {
      onTransformChange?.(transform)
    }, [transform, onTransformChange])
    const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addParentId, setAddParentId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [todoNodeId, setTodoNodeId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [todoLists, setTodoLists] = useState<Record<string, { id: string; text: string; done: boolean }[]>>({})
  const modeRef = useRef<'canvas' | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id))
  }, [])


    const pan = useCallback((dx: number, dy: number) => {
      console.log('[MindmapCanvas] pan', dx, dy)
      setTransform(prev => ({ x: prev.x + dx, y: prev.y + dy, k: prev.k }))
    }, [])


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

    const handleSaveNewNode = () => {
      if (!mindmapId || !containerRef.current) return

      if (!newName?.trim()) {
        alert('Please enter a name for the node.')
        return
      }

      const newNode = {
        // Default position for the very first node
        // Explicit coordinates help avoid inserting extreme
        // values when the board is empty
        x: 500,
        y: 500,
        label: newName?.trim() || 'General',
        description: newDesc?.trim() || undefined,
        parentId: null,
        mindmapId,
      }

      console.log('[Modal Save] Submitting new node with values:', {
        newName,
        newDesc,
      })

      authFetch('/.netlify/functions/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNode),
      })
        .then(async res => {
          if (!res.ok) throw new Error('Node insert failed')
          const data = await res.json()
          if (!data?.id) throw new Error('Node insert failed')
          setNodes(prev => [...prev, { ...newNode, id: data.id }])
          setShowCreate(false)
          setNewName('')
          setNewDesc('')
        })
        .catch(err => {
          console.error('[CreateNode] Failed to save node:', err)
        })
    }

    const handleAddChild = useCallback(() => {
      console.log('[MindmapCanvas] handleAddChild')
      if (!addParentId) return
      const parent = safeNodes.find(n => n.id === addParentId)
      if (!parent) {
        setAddParentId(null)
        return
      }
      const siblingCount = safeNodes.filter(n => n.parentId === addParentId).length
      const newNode = {
        x: parent.x + 150,
        y: parent.y + 50 * (siblingCount + 1),
        label: newName || 'New Node',
        description: newDesc || '',
        parentId: addParentId,
        mindmapId,
      }

      authFetch('/.netlify/functions/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNode),
      })
        .then(async res => {
          if (!res.ok) throw new Error('Node insert failed')
          const data = await res.json()
          if (!data?.id) throw new Error('Node insert failed')
          addNode({ ...newNode, id: data.id, todoId: null })
        })
        .catch(err => {
          console.error('[CreateChildNode] Failed to save node:', err)
        })
        .finally(() => {
          setAddParentId(null)
          setNewName('')
          setNewDesc('')
        })
    }, [addParentId, addNode, Array.isArray(nodes) ? nodes : [], newName, newDesc, mindmapId])

    const openEditModal = useCallback((id: string) => {
      console.log('[MindmapCanvas] openEditModal', id)
      const node = safeNodes.find(n => n.id === id)
      if (!node) return
      setEditingId(id)
      setEditTitle(node.label || '')
      setEditDesc(node.description || '')
    }, [Array.isArray(nodes) ? nodes : []])

    const updateNode = useCallback((node: NodeData) => {
      console.log('[MindmapCanvas] updateNode', node)
      setNodes(prev =>
        Array.isArray(prev)
          ? prev.map(n => (n.id === node.id ? { ...n, ...node } : n))
          : prev
      )
    }, [])

    const removeNode = useCallback((nodeId: string) => {
      console.log('[MindmapCanvas] removeNode', nodeId)
      setNodes(prev => (Array.isArray(prev) ? prev.filter(n => n.id !== nodeId) : prev))
      setEdges(prev => (Array.isArray(prev) ? prev.filter(e => e.from !== nodeId && e.to !== nodeId) : prev))
    }, [])

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

    useImperativeHandle(
      ref,
      () => ({ pan, addNode, updateNode, removeNode }),
      [pan, addNode, updateNode, removeNode]
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
        }
      },
      [transform.k]
    )

    const handlePointerUp = useCallback((e: PointerEvent) => {
      console.log('[MindmapCanvas] handlePointerUp')
      modeRef.current = null
      svgRef.current?.releasePointerCapture(e.pointerId)
    }, [])

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<SVGSVGElement>) => {
        console.log('[MindmapCanvas] handlePointerDown')
        e.stopPropagation()
        if ((e.target as HTMLElement).closest('.add-child-button')) return
        dragStartRef.current = { x: e.clientX, y: e.clientY }
        modeRef.current = 'canvas'
        originRef.current = { x: transform.x, y: transform.y }
        setSelectedId(null)
        svgRef.current?.setPointerCapture(e.pointerId)
      },
      [transform]
    )


    const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
      console.log('[MindmapCanvas] handleWheel', e.deltaY)
      // Prevent page scrolling when the user scrolls over the canvas
      e.preventDefault()
    }, [])

    // touch handlers for panning only

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
        }
      },
      [transform.k]
    )

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      console.log('[MindmapCanvas] handleTouchEnd')
      if (e.touches.length < 1) {
        modeRef.current = null
      }
      // ignore multi-touch end events
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
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest('.node-toolbox')) return
          setSelectedId(null)
          modeRef.current = null
        }}
        style={{
          width: containerWidth,
          height: containerHeight,
          overflow: 'hidden',
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
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <pattern
              id="grid-dots"
              width={DOT_SPACING}
              height={DOT_SPACING}
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#ddd" />
            </pattern>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#fff" />
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#grid-dots)" />
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            {Array.isArray(safeEdges) &&
              safeEdges.length > 0 &&
              safeEdges.map(edge => {
              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null
              return (
                <path
                  key={edge.id}
                  d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${
                    (from.y + to.y) / 2 + (to.y > from.y ? 40 : -40)
                  } ${to.x},${to.y}`}
                  fill="none"
                  stroke="#888"
                  strokeWidth={2 / transform.k}
                />
              )
            })}
            {Array.isArray(safeNodes) &&
              safeNodes.length > 0 &&
              safeNodes.map(node => (
              <g
                key={node.id}
                className="mindmap-node"
                data-id={node.id}
                transform={`translate(${node.x},${node.y})`}
                onPointerDown={e => {
                  e.stopPropagation()
                  handleNodeClick(node.id)
                }}
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
              {selectedId === node.id && null}
              </g>
            ))}
          </g>
        </svg>
        {Array.isArray(safeNodes) &&
          safeNodes.length > 0 &&
          safeNodes.map(node =>
            selectedId === node.id ? (
              <div
                key={`toolbox-${node.id}`}
                className="node-toolbox"
                style={{
                  position: 'absolute',
                  left: node.x * transform.k + transform.x + TOOL_OFFSET_X,
                  top: node.y * transform.k + transform.y + TOOL_OFFSET_Y,
                  transform: `translate(-50%, -100%) scale(${1 / transform.k})`,
                  transformOrigin: 'top left',
                  zIndex: 5,
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="node-toolbox-button"
                  style={{ pointerEvents: 'auto' }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(null)
                    setAddParentId(node.id)
                    setNewName('')
                    setNewDesc('')
                  }}
                >
                  +
                </div>
                <div
                  className="node-toolbox-button"
                  style={{ pointerEvents: 'auto' }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(null)
                    openEditModal(node.id)
                  }}
                >
                  🖉
                </div>
                <div
                  className="node-toolbox-button"
                  style={{ pointerEvents: 'auto' }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(null)
                    handleDeleteNode(node.id)
                  }}
                >
                  🗑
                </div>
                <div
                  className="node-toolbox-button"
                  style={{ pointerEvents: 'auto' }}
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedId(null)
                    setTodoNodeId(node.id)
                  }}
                >
                  ✅
                </div>
              </div>
            ) : null
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
                <button
                  className="btn-primary"
                  onClick={handleSaveNewNode}
                  disabled={!newName?.trim()}
                >
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
                  todoLists[todoNodeId]!.length > 0 &&
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
