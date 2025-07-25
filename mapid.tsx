async function loadMap(mapId: string, signal?: AbortSignal): Promise<MapData> {
  const res = await fetch(`/api/maps/${mapId}`, { signal })
  if (!res.ok) throw new Error(`Failed to load map: ${res.status}`)
  return res.json()
}

async function saveMapData(map: MapData): Promise<void> {
  const res = await fetch(`/api/maps/${map.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(map),
  })
  if (!res.ok) throw new Error(`Failed to save map: ${res.status}`)
}

export default function MapPage({ mapId }: { mapId: string }): JSX.Element {
  const [map, setMap] = useState<MapData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loadTrigger, setLoadTrigger] = useState<number>(0)

  useEffect(() => {
    localStorage.setItem(`mindmap_last_viewed_${mapId}`, Date.now().toString())
  }, [mapId])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)

    loadMap(mapId, controller.signal)
      .then(data => setMap(data))
      .catch(err => {
        if (err.name !== 'AbortError') setLoadError(err.message)
      })
      .finally(() => setLoading(false))

    return () => {
      controller.abort()
    }
  }, [mapId, loadTrigger])

  const handleReload = useCallback(() => {
    setLoadTrigger(prev => prev + 1)
  }, [])

  const generateId = useCallback(() => {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : uuidv4()
  }, [])

  const handleNodeAdd = useCallback((parentId?: string) => {
    setMap(prev => {
      if (!prev) return prev
      const newNode: NodeData = { id: generateId(), content: '', parentId }
      return { ...prev, nodes: [...prev.nodes, newNode] }
    })
  }, [generateId])

  const handleNodeUpdate = useCallback((node: NodeData) => {
    setMap(prev => {
      if (!prev) return prev
      const safeNodes = Array.isArray(prev.nodes) ? prev.nodes : []
      return {
        ...prev,
        nodes: safeNodes.map(n => (n.id === node.id ? node : n)),
      }
    })
  }, [])

  const handleNodeDelete = useCallback((nodeId: string) => {
    setMap(prev => {
      if (!prev) return prev
      const safeNodes = Array.isArray(prev.nodes) ? prev.nodes : []
      return {
        ...prev,
        nodes: safeNodes.filter(n => n.id !== nodeId),
      }
    })
  }, [])

  const saveMap = useCallback(async () => {
    if (!map) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveMapData(map)
    } catch (err: any) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }, [map])

  if (loading) {
    return <div>Loading map...</div>
  }

  if (!map) {
    return (
      <div>
        <div>Error loading map: {loadError}</div>
        <button onClick={handleReload}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      {saveError && <div>Error saving map: {saveError}</div>}
      <div>
        <label>
          Title:{' '}
          <input
            type="text"
            value={map.title}
            onChange={e =>
              setMap(prev => (prev ? { ...prev, title: e.target.value } : prev))
            }
            disabled={saving}
          />
        </label>
      </div>
      <button onClick={() => handleNodeAdd()} disabled={saving}>
        Add Root Node
      </button>
      <ul>
        {Array.isArray(map.nodes)
          ? map.nodes.map(node => (
              <li key={node.id}>
                <input
                  type="text"
                  value={node.content}
                  onChange={e =>
                    handleNodeUpdate({ ...node, content: e.target.value })
                  }
                  disabled={saving}
                />
                <button onClick={() => handleNodeAdd(node.id)} disabled={saving}>
                  Add Child
                </button>
                <button onClick={() => handleNodeDelete(node.id)} disabled={saving}>
                  Delete
                </button>
              </li>
            ))
          : null}
      </ul>
      <button onClick={saveMap} disabled={saving}>
        {saving ? 'Saving...' : 'Save Map'}
      </button>
    </div>
  )
}