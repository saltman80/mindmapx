import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useEffect
} from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import MiniMap from './MiniMap'
import type { NodeData, EdgeData, Direction } from './mindmapTypes'
import { authFetch } from './authFetch'

const DOT_SPACING = 50
const GRID_SIZE = 500
const CANVAS_SIZE = DOT_SPACING * GRID_SIZE
const TOOL_OFFSET_X = 0
const TOOL_OFFSET_Y = -40
// Radial layout constants
// Distance of children from their parent grows with depth
const LEVEL_DISTANCE = 150
// Minimum spacing between sibling nodes to avoid label overlap
const MIN_SIBLING_GAP = 100

interface MindmapCanvasProps {
  nodes?: NodeData[]
  edges?: EdgeData[]
  width?: number | string
  height?: number | string
  onAddNode?: (node: NodeData) => Promise<string | undefined> | string | undefined
  onMoveNode?: (node: NodeData) => void
  onUpdateNode?: (node: NodeData) => void
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

interface NodePayload {
  mindmapId: string
  x?: number
  y?: number
  label?: string | null
  description?: string | null
  parentId?: string | null
  linkedTodoListId?: string | null
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
      onUpdateNode,
      initialTransform = { x: 0, y: 0, k: 1 },
      onTransformChange,
      showMiniMap = false,
      mindmapId,
    },
    ref
  ) => {
    const safePropNodes = Array.isArray(propNodes) ? propNodes : []
    const safePropEdges = Array.isArray(propEdges) ? propEdges : []

    const navigate = useNavigate()

    const [nodes, setNodes] = useState<NodeData[]>(() => safePropNodes)
    const [edges, setEdges] = useState<EdgeData[]>(() => safePropEdges)

    const safeNodes = Array.isArray(nodes) ? nodes : []
    const safeEdges = Array.isArray(edges) ? edges : []

    const uniqueNodes = useMemo(() => {
      const seen = new Map<string, NodeData>()
      for (const n of safeNodes) {
        // Use node id to ensure only one entry per node
        if (!seen.has(n.id)) {
          seen.set(n.id, n)
        } else {
          // merge to keep latest data if duplicates exist
          seen.set(n.id, { ...seen.get(n.id)!, ...n })
        }
      }
      return Array.from(seen.values())
    }, [safeNodes])
    const [hasCentered, setHasCentered] = useState(false)
    const [transform, setTransform] = useState<{ x: number; y: number; k: number }>(
      () => initialTransform
    )

    useEffect(() => {
      setTransform(initialTransform)
    }, [initialTransform])
    const svgRef = useRef<SVGSVGElement | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)


    useEffect(() => {
      setNodes(safePropNodes)
    }, [propNodes])

    useEffect(() => {
      setEdges(safePropEdges)
    }, [propEdges])

    useEffect(() => {
      console.log(
        'Loaded node positions:',
        uniqueNodes.map(n => ({ id: n.id, x: n.x, y: n.y }))
      )
    }, [uniqueNodes])

    useEffect(() => {
      onTransformChange?.(transform)
    }, [transform, onTransformChange])
    const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [todoNodeId, setTodoNodeId] = useState<string | null>(null)
  const [newTask, setNewTask] = useState('')
  const [todoLists, setTodoLists] = useState<Record<string, { id: string; text: string; done: boolean }[]>>({})
  const modeRef = useRef<'canvas' | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const originRef = useRef({ x: 0, y: 0 })

  // Load todos for nodes so completion status can be reflected in the UI
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await authFetch('/.netlify/functions/todo-lists')
        const data = await res.json()
        if (!active || !Array.isArray(data)) return
        const map: Record<string, { id: string; text: string; done: boolean }[]> = {}
        data.forEach((list: any) => {
          if (list.node_id && Array.isArray(list.todos)) {
            map[list.node_id] = list.todos.map((t: any) => ({
              id: t.id,
              text: t.title,
              done: !!t.completed,
            }))
          }
        })
        setTodoLists(map)
      } catch (err) {
        console.error('[MindmapCanvas] failed to load todo lists', err)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [mindmapId])

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id))
  }, [])


    const pan = useCallback((dx: number, dy: number) => {
      console.log('[MindmapCanvas] pan', dx, dy)
      setTransform(prev => ({ x: prev.x + dx, y: prev.y + dy, k: prev.k }))
    }, [])


    const addNode = useCallback(
      (node: NodeData) => {
        console.log('[MindmapCanvas] addNode', node)
        setNodes(prev => [...prev, node])
        if (
          node.parentId &&
          !safeEdges.some(e => e.from === node.parentId && e.to === node.id)
        ) {
          const edgeId =
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2)
          const edge: EdgeData = { id: edgeId, from: node.parentId, to: node.id }
          setEdges(prev => [...prev, edge])
        }
      },
      [safeEdges]
    )

    const replaceNodeId = useCallback((tempId: string, newId: string) => {
      setNodes(prev =>
        Array.isArray(prev)
          ? prev.map(n => (n.id === tempId ? { ...n, id: newId } : n))
          : prev
      )
      setEdges(prev =>
        Array.isArray(prev)
          ? prev.map(e => ({
              ...e,
              from: e.from === tempId ? newId : e.from,
              to: e.to === tempId ? newId : e.to,
            }))
          : prev
      )
    }, [])

    const createNode = useCallback(async (node: NodePayload): Promise<string | null> => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log('[MindmapCanvas] createNode payload:', node)
          const res = await authFetch('/.netlify/functions/nodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(node),
          })

          if (res.ok) {
            const data = await res.json()
            console.log('[MindmapCanvas] createNode response:', data)
            return data.id || null
          }

          const err = await res.json().catch(() => ({}))
          if (
            (res.status === 404 || res.status === 500) &&
            typeof err?.error === 'string' &&
            err.error.toLowerCase().includes('mindmap')
          ) {
            await authFetch('/.netlify/functions/mindmaps', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: { title: 'Untitled', description: '' } })
            })
            await new Promise(r => setTimeout(r, 300))
            continue
          }
          console.error('[MindmapCanvas] createNode failed', res.status)
          return null
        } catch (err) {
          console.error('[MindmapCanvas] createNode attempt error', err)
        }
      }
      return null
    }, [])


    const creatingNodeRef = useRef(false)

    const handleAddChild = useCallback(
      async (parentId: string) => {
        console.log('[MindmapCanvas] handleAddChild', parentId)
        if (creatingNodeRef.current) {
          console.warn('[handleAddChild] Creation in progress, skipping')
          return
        }
        if (!mindmapId) {
          console.warn('[handleAddChild] Missing mindmapId')
          return
        }
        const parent = uniqueNodes.find(n => n.id === parentId)
        if (!parent) return
        creatingNodeRef.current = true

        const siblings = uniqueNodes.filter(n => n.parentId === parentId)

        const getDepth = (nodeId: string): number => {
          let depth = 0
          let current = uniqueNodes.find(n => n.id === nodeId)
          while (current && current.parentId) {
            current = uniqueNodes.find(n => n.id === current!.parentId)
            depth++
          }
          return depth
        }

        const getDirection = (node: NodeData): Direction => {
          if (!node.parentId) return 'tr'
          const p = uniqueNodes.find(n => n.id === node.parentId)
          if (!p) return 'tr'
          const dx = node.x - p.x
          const dy = node.y - p.y
          if (dx >= 0 && dy <= 0) return 'tr'
          if (dx >= 0 && dy > 0) return 'br'
          if (dx < 0 && dy > 0) return 'bl'
          return 'tl'
        }

        const directionAngles: Record<Direction, number> = {
          tr: -Math.PI / 4,
          br: Math.PI / 4,
          bl: (3 * Math.PI) / 4,
          tl: (-3 * Math.PI) / 4,
        }
        const angleToDirection = (a: number): Direction => {
          const t = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
          if (t >= 0 && t < Math.PI / 2) return 'tr'
          if (t >= Math.PI / 2 && t < Math.PI) return 'br'
          if (t >= Math.PI && t < (3 * Math.PI) / 2) return 'bl'
          return 'tl'
        }

        const depth = getDepth(parent.id) + 1
        const baseRadius = LEVEL_DISTANCE * depth
        const isRoot = !parent.parentId
        const total = siblings.length + 1
        const arc = isRoot ? Math.PI * 2 : (Math.PI * 2) / 3
        const angleStep = arc / total
        const radius = Math.max(
          baseRadius,
          MIN_SIBLING_GAP / (2 * Math.sin(angleStep / 2))
        )
        const centerAngle = isRoot ? 0 : directionAngles[getDirection(parent)]
        const startAngle = centerAngle - arc / 2
        const angle = startAngle + angleStep * siblings.length + angleStep / 2

        const newX = Math.round(parent.x + Math.cos(angle) * radius)
        const newY = Math.round(parent.y + Math.sin(angle) * radius)
        const direction = angleToDirection(angle)

        const newNode: NodePayload = {
          mindmapId,
          x: newX,
          y: newY,
          label: `Child of ${parent.label || 'Node'}`,
          description: '',
          parentId: parent.id || null,
          linkedTodoListId: null,
        }

        console.log(
          'Creating node:',
          newNode.label,
          newNode.parentId,
          newNode.mindmapId,
          newNode.x,
          newNode.y
        )

        const tempId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)

        addNode({
          ...newNode,
          id: tempId,
          todoId: null,
          linkedTodoListId: null,
          direction,
        })

        try {
          let nodeId: string | undefined
          if (onAddNode) {
            const result = await onAddNode(newNode)
            if (typeof result === 'string') nodeId = result
          } else {
            nodeId = (await createNode(newNode)) || undefined
          }
          if (nodeId) {
            replaceNodeId(tempId, nodeId)
          } else {
            console.error('[MindmapCanvas] Failed to create node', newNode)
          }
        } finally {
          creatingNodeRef.current = false
        }
    }, [addNode, uniqueNodes, mindmapId, createNode, replaceNodeId, onAddNode])

    const openEditModal = useCallback((id: string) => {
      console.log('[MindmapCanvas] openEditModal', id)
      const node = uniqueNodes.find(n => n.id === id)
      if (!node) return
      setEditingId(id)
      setEditTitle(node.label || '')
      setEditDesc(node.description || '')
    }, [uniqueNodes])

    const updateNode = useCallback(
      (node: NodeData) => {
        console.log('[MindmapCanvas] updateNode', node)
        setNodes(prev =>
          Array.isArray(prev)
            ? prev.map(n => (n.id === node.id ? { ...n, ...node } : n))
            : prev
        )
        onUpdateNode?.(node)
      },
      [onUpdateNode]
    )

    const removeNode = useCallback((nodeId: string) => {
      console.log('[MindmapCanvas] removeNode', nodeId)
      setNodes(prev => (Array.isArray(prev) ? prev.filter(n => n.id !== nodeId) : prev))
      setEdges(prev => (Array.isArray(prev) ? prev.filter(e => e.from !== nodeId && e.to !== nodeId) : prev))
    }, [])

    const handleSaveEdit = useCallback(() => {
      console.log('[MindmapCanvas] handleSaveEdit')
      if (!editingId) return
      const node = uniqueNodes.find(n => n.id === editingId)
      if (!node) return
      const updated = { ...node, label: editTitle, description: editDesc }
      updateNode(updated)
      onUpdateNode?.(updated)
      authFetch(`/.netlify/functions/nodes/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editTitle, description: editDesc })
      }).catch(err => console.error('[MindmapCanvas] update failed', err))
      setEditingId(null)
      setEditTitle('')
      setEditDesc('')
    }, [editingId, editTitle, editDesc, uniqueNodes, updateNode])

    const handleDeleteNode = useCallback(
      async (id: string) => {
        console.log('[MindmapCanvas] handleDeleteNode', id)
        if (!window.confirm('Are you sure you want to delete this node?')) return
        try {
          const res = await authFetch(`/.netlify/functions/nodes/${id}`, {
            method: 'DELETE',
          })
          if (!res.ok) throw new Error(`Failed: ${res.status}`)
          removeNode(id)
        } catch (err) {
          console.error('[MindmapCanvas] delete failed', err)
          alert('Failed to delete node')
        }
      },
      [removeNode]
    )

    const handleTodoClick = useCallback(
      async (node: NodeData) => {
        if (node.linkedTodoListId) {
          navigate(`/todos/${node.linkedTodoListId}`)
          return
        }
        try {
          const res = await authFetch('/.netlify/functions/todo-lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: node.label || 'Todo List', nodeId: node.id })
          })
          if (!res.ok) throw new Error('create failed')
          const list = await res.json()
          updateNode({ ...node, linkedTodoListId: list.id })
          authFetch(`/.netlify/functions/nodes/${node.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linkedTodoListId: list.id })
          }).catch(() => {})
          navigate(`/todos/${list.id}`)
        } catch (err) {
          console.error('Todo list create failed', err)
        }
      },
      [navigate, updateNode]
    )

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

    useEffect(() => {
      if (
        Array.isArray(nodes) &&
        nodes.length > 0 &&
        !hasCentered &&
        containerRef.current
      ) {
        setHasCentered(true)
        const { clientWidth, clientHeight } = containerRef.current
        const root = nodes.find(n => !n.parentId) ?? nodes[0]
        const centerX = root.x
        const centerY = root.y
        setTransform(prev => ({
          x: clientWidth / 2 - centerX * prev.k,
          y: clientHeight / 2 - centerY * prev.k,
          k: prev.k,
        }))
      }
    }, [nodes, hasCentered, transform.k])

    const nodeMap = useMemo(() => {
      const map = new Map<string, NodeData>()
      const arr = Array.isArray(nodes) ? nodes : []
      arr.forEach(n => map.set(n.id, n))
      return map
    }, [Array.isArray(nodes) ? nodes : []])

    const rootNode = useMemo(
      () => uniqueNodes.find(n => !n.parentId) || null,
      [uniqueNodes]
    )

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
        : width ?? '100%'
    const containerHeight =
      typeof height === 'number'
        ? `${height}px`
        : height ?? '100vh'

    return (
      <div
        id="mindmap-container"
        className="mindmap-canvas-wrapper"
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
            uniqueNodes.length === 0 && safeEdges.length === 0
              ? 'pointer'
              : 'default'
        }}
      >
        <svg
          className="mindmap-canvas"
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
              <circle cx="1" cy="1" r="1" fill="var(--mindmap-grid-color)" />
            </pattern>
            <radialGradient id="center-glow" r="50%">
              <stop offset="0%" stopColor="var(--color-primary-light)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--color-primary-light)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#fff" />
          <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="url(#grid-dots)" />
          <motion.g
            animate={{ x: transform.x, y: transform.y, scale: transform.k }}
            initial={false}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            style={{ originX: 0, originY: 0 }}
          >
            {rootNode && (
              <circle
                className="mindmap-center-glow"
                cx={rootNode.x}
                cy={rootNode.y}
                r={40 / transform.k}
                pointerEvents="none"
              />
            )}
            {Array.isArray(safeEdges) &&
              safeEdges.length > 0 &&
              safeEdges.map((edge, i) => {
                const from = nodeMap.get(edge.from)
                const to = nodeMap.get(edge.to)
                if (!from || !to) return null
                return (
                  <motion.path
                    key={edge.id}
                    className="mindmap-edge"
                    d={`M${from.x},${from.y} Q${(from.x + to.x) / 2},${
                      (from.y + to.y) / 2 + (to.y > from.y ? 40 : -40)
                    } ${to.x},${to.y}`}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                )
              })}
            {Array.isArray(uniqueNodes) &&
              uniqueNodes.length > 0 &&
              uniqueNodes.map((node, i) => {
                console.log(`[RENDER] Node ${node.label} - x: ${node.x}, y: ${node.y}`)
                const nx =
                  typeof node.x === 'number' && Number.isFinite(node.x) ? node.x : 0
                const ny =
                  typeof node.y === 'number' && Number.isFinite(node.y) ? node.y : 0
                return (
                  <g
                    key={node.id}
                    className={(() => {
                      if (!node.linkedTodoListId) return 'mindmap-node'
                      const list = todoLists[node.id]
                      const allDone = Array.isArray(list) && list.length > 0 && list.every(t => t.done)
                      return `mindmap-node ${allDone ? 'todo-complete' : 'has-todo'}`
                    })()}
                    data-id={node.id}
                    onPointerDown={e => {
                      e.stopPropagation()
                      handleNodeClick(node.id)
                    }}
                  >
                    <circle
                      className="mindmap-node-circle"
                      cx={nx}
                      cy={ny}
                      r={20 / transform.k}
                      vectorEffect="non-scaling-stroke"
                    />
                    {node.label && (
                      <text
                        x={nx}
                        y={ny}
                        textAnchor="middle"
                        dy=".35em"
                        fontSize={14 / transform.k}
                        pointerEvents="none"
                      >
                        {node.label}
                      </text>
                    )}
                    {(() => {
                      const list = todoLists[node.id]
                      return (
                        Array.isArray(list) &&
                        list.length > 0 &&
                        list.every(t => t.done)
                      )
                    })() ? (
                      <text
                        fontSize={12 / transform.k}
                        x={nx + 14 / transform.k}
                        y={ny + 14 / transform.k}
                      >
                        ✓
                      </text>
                    ) : null}
                    {selectedId === node.id && null}
                  </g>
                )
              })}
          </motion.g>
        </svg>
        {Array.isArray(uniqueNodes) &&
          uniqueNodes.length > 0 &&
          uniqueNodes.map(node =>
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
                    handleAddChild(node.id)
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
                    handleTodoClick(node)
                  }}
                >
                  {node.linkedTodoListId ? '📋' : '✅'}
                </div>
              </div>
            ) : null
          )}

        {/* Add-child modal removed for auto-placement workflow */}
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
            nodes={uniqueNodes}
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
