const defaultNodes: Node[] = [
  {
    id: 'root',
    label: 'Mindmap',
    x: 400,
    y: 300,
    children: [
      {
        id: 'root-1',
        label: 'Features',
        x: 200,
        y: 150,
        children: [
          { id: 'root-1-1', label: 'Interactive', x: 100, y: 50 },
          { id: 'root-1-2', label: 'Responsive', x: 300, y: 50 }
        ]
      },
      {
        id: 'root-2',
        label: 'Todo',
        x: 600,
        y: 150,
        children: [
          { id: 'root-2-1', label: 'List', x: 500, y: 50 },
          { id: 'root-2-2', label: 'Tasks', x: 700, y: 50 }
        ]
      },
      { id: 'root-3', label: 'Demo', x: 400, y: 450 }
    ]
  }
]

export default function MindmapDemo(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flatNodes, setFlatNodes] = useState<Node[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const nodesRef = useRef<Node[]>([])
  const parentMapRef = useRef<Record<string, Node>>({})

  // Flatten the tree into a list
  useEffect(() => {
    const flatten = (nodes: Node[]): Node[] => {
      let res: Node[] = []
      nodes.forEach(n => {
        const { children, ...rest } = n
        res.push(rest)
        if (children) {
          res = res.concat(flatten(children))
        }
      })
      return res
    }
    const flat = flatten(defaultNodes)
    setFlatNodes(flat)
  }, [])

  // Keep refs up to date
  useEffect(() => {
    nodesRef.current = flatNodes
    const map: Record<string, Node> = {}
    flatNodes.forEach(n => {
      map[n.id] = n
    })
    parentMapRef.current = map
  }, [flatNodes])

  // Draw and resize handling
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let resizeObserver: ResizeObserver

    const draw = () => {
      const ratio = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      ctx.resetTransform()
      ctx.scale(ratio, ratio)
      ctx.clearRect(0, 0, width, height)

      // draw connections
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      flatNodes.forEach(n => {
        if (n.id === 'root') return
        const parentId = n.id.split('-').slice(0, -1).join('-') || 'root'
        const parent = parentMapRef.current[parentId]
        if (parent) {
          ctx.beginPath()
          ctx.moveTo(parent.x, parent.y)
          ctx.lineTo(n.x, n.y)
          ctx.stroke()
        }
      })

      // draw nodes
      flatNodes.forEach(n => {
        const isSelected = n.id === selectedNodeId
        ctx.beginPath()
        ctx.arc(n.x, n.y, 30, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.strokeStyle = isSelected ? '#0070f3' : '#666'
        ctx.lineWidth = isSelected ? 3 : 1
        ctx.stroke()
        ctx.fillStyle = '#000'
        ctx.font = '14px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(n.label, n.x, n.y)
      })
    }

    // initial draw
    draw()

    // observe resize of container
    resizeObserver = new ResizeObserver(() => {
      draw()
    })
    resizeObserver.observe(canvas)

    // also handle window resize
    window.addEventListener('resize', draw)

    return () => {
      window.removeEventListener('resize', draw)
      resizeObserver.disconnect()
    }
  }, [flatNodes, selectedNodeId])

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId)
  }, [])

  // click detection
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      for (const n of nodesRef.current) {
        const dx = x - n.x
        const dy = y - n.y
        if (dx * dx + dy * dy <= 30 * 30) {
          handleNodeClick(n.id)
          break
        }
      }
    }
    canvas.addEventListener('click', onClick)
    return () => {
      canvas.removeEventListener('click', onClick)
    }
  }, [handleNodeClick])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: '800px', height: 'auto', display: 'block' }}
    />
  )
}