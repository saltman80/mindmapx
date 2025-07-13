function isMindmapNode(obj: any): obj is MindmapNode {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    (obj.parentId === null || typeof obj.parentId === 'string') &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.label === 'string'
  )
}

function isMindmap(obj: any): obj is Mindmap {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    Array.isArray(obj.nodes) &&
    obj.nodes.every(isMindmapNode)
  )
}

export function useMindmap(): UseMindmapResult {
  const [map, setMap] = useState<Mindmap | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  const loadMap = useCallback(async (mapId: string) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/.netlify/functions/getMap?mapId=${encodeURIComponent(mapId)}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error('Failed to load map')
      const data: unknown = await res.json()
      if (!isMindmap(data)) throw new Error('Invalid map data')
      if (!mountedRef.current) return
      setMap(data)
      setSelectedNodeId(null)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      if (mountedRef.current) setError(err)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [])

  const addNode = useCallback(
    async (node: Omit<MindmapNode, 'id'>) => {
      setIsLoading(true)
      setError(null)
      if (!map) {
        setError(new Error('Map not loaded'))
        setIsLoading(false)
        return
      }
      const controller = new AbortController()
      try {
        const res = await fetch(`/.netlify/functions/addNode`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mapId: map.id, node }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to add node')
        const data: unknown = await res.json()
        if (!isMindmapNode(data)) throw new Error('Invalid node data')
        if (!mountedRef.current) return
        setMap(prev => (prev ? { ...prev, nodes: [...prev.nodes, data] } : prev))
      } catch (err: any) {
        if (err.name === 'AbortError') return
        if (mountedRef.current) setError(err)
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    },
    [map],
  )

  const updateNode = useCallback(
    async (updated: Partial<Omit<MindmapNode, 'id'>> & { id: string }) => {
      setIsLoading(true)
      setError(null)
      if (!map) {
        setError(new Error('Map not loaded'))
        setIsLoading(false)
        return
      }
      const controller = new AbortController()
      try {
        const res = await fetch(`/.netlify/functions/updateNode`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mapId: map.id, node: updated }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Failed to update node')
        const data: unknown = await res.json()
        if (!isMindmapNode(data)) throw new Error('Invalid node data')
        if (!mountedRef.current) return
        setMap(prev =>
          prev
            ? { ...prev, nodes: prev.nodes.map(n => (n.id === data.id ? data : n)) }
            : prev,
        )
      } catch (err: any) {
        if (err.name === 'AbortError') return
        if (mountedRef.current) setError(err)
      } finally {
        if (mountedRef.current) setIsLoading(false)
      }
    },
    [map],
  )

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId)
  }, [])

  return { map, selectedNodeId, isLoading, error, loadMap, addNode, updateNode, selectNode }
}