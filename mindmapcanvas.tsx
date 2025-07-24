import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useEffect
} from 'react'

const MindmapCanvas = forwardRef<MindmapCanvasHandle, MindmapCanvasProps>(
  ({ nodes: propNodes = [], edges: propEdges = [], width, height }, ref) => {
    const safePropNodes = Array.isArray(propNodes) ? propNodes : []
    const safePropEdges = Array.isArray(propEdges) ? propEdges : []

    const [nodes, setNodes] = useState<NodeData[]>(() => safePropNodes)
    const [edges, setEdges] = useState<EdgeData[]>(() => safePropEdges)
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
    const svgRef = useRef<SVGSVGElement | null>(null)
    const draggingRef = useRef(false)
    const lastMousePos = useRef({ x: 0, y: 0 })
    const pinchRef = useRef<{
      initialDistance: number
      initialCenter: { x: number; y: number }
      initialTransform: { x: number; y: number; k: number }
    } | null>(null)

    const pan = useCallback((dx: number, dy: number) => {
      setTransform(prev => ({ x: prev.x + dx, y: prev.y + dy, k: prev.k }))
    }, [])

    const zoom = useCallback(
      (scale: number, centerX = 0, centerY = 0) => {
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
      setNodes(prev => [...prev, node])
    }, [])

    const updateNode = useCallback((node: NodeData) => {
      setNodes(prev => prev.map(n => (n.id === node.id ? { ...n, ...node } : n)))
    }, [])

    const removeNode = useCallback((nodeId: string) => {
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
      nodes.forEach(n => map.set(n.id, n))
      return map
    }, [nodes])

    const safeNodes = useMemo(() => (Array.isArray(nodes) ? nodes : []), [nodes])
    const safeEdges = useMemo(() => (Array.isArray(edges) ? edges : []), [edges])

    console.log('[MindmapCanvas] rendering nodes:', safeNodes)
    console.log('[MindmapCanvas] rendering edges:', safeEdges)

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!draggingRef.current) return
        e.preventDefault()
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        pan(dx, dy)
      },
      [pan]
    )

    const handleMouseUp = useCallback(() => {
      draggingRef.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }, [handleMouseMove])

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        draggingRef.current = true
        lastMousePos.current = { x: e.clientX, y: e.clientY }
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
      },
      [handleMouseMove, handleMouseUp]
    )

    useEffect(() => {
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }, [handleMouseMove, handleMouseUp])

    const handleWheel = useCallback(
      (e: React.WheelEvent<SVGSVGElement>) => {
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

    const handleTouchStart = useCallback(
      (e: React.TouchEvent<SVGSVGElement>) => {
        if (!svgRef.current) return
        if (e.touches.length === 1) {
          e.preventDefault()
          draggingRef.current = true
          lastMousePos.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
          }
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
        if (!svgRef.current) return
        if (e.touches.length === 1 && draggingRef.current) {
          e.preventDefault()
          const touch = e.touches[0]
          const dx = touch.clientX - lastMousePos.current.x
          const dy = touch.clientY - lastMousePos.current.y
          lastMousePos.current = {
            x: touch.clientX,
            y: touch.clientY
          }
          pan(dx, dy)
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
      [pan]
    )

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (e.touches.length < 1) {
        draggingRef.current = false
      }
      if (e.touches.length < 2) {
        pinchRef.current = null
      }
    }, [])

    return (
      <div
        style={{
          width: width ?? '100%',
          height: height ?? '100%',
          touchAction: 'none'
        }}
      >
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
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
              <circle cx="1" cy="1" r="1" fill="#ccc" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            {safeEdges.map(edge => {
              const from = nodeMap.get(edge.from)
              const to = nodeMap.get(edge.to)
              if (!from || !to) return null
              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#888"
                  strokeWidth={2 / transform.k}
                />
              )
            })}
            {safeNodes.map(node => (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
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
              </g>
            ))}
          </g>
        </svg>
      </div>
    )
  }
)

MindmapCanvas.displayName = 'MindmapCanvas'

export default MindmapCanvas
