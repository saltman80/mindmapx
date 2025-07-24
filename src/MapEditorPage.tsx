import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MindmapCanvas from '../mindmapcanvas'

interface NodeData {
  id: string
  content: string
  parentId?: string
}

interface MapData {
  id: string
  title: string
  nodes: NodeData[]
}

async function loadMap(id: string, signal?: AbortSignal): Promise<MapData> {
  const res = await fetch(`/api/maps/${id}`, { signal })
  if (!res.ok) throw new Error(`Failed to load map: ${res.status}`)
  return res.json()
}

async function saveMap(map: MapData): Promise<void> {
  const res = await fetch(`/api/maps/${map.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(map),
  })
  if (!res.ok) throw new Error(`Failed to save map: ${res.status}`)
}

export default function MapEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const mapId = id || ''
  const [map, setMap] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trigger, setTrigger] = useState(0)
  interface CanvasNode { id: string; x: number; y: number; label?: string }
  interface CanvasEdge { id: string; from: string; to: string }
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([])
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([])

  useEffect(() => {
    if (!map) return
    const nodes = map.nodes.map((n, i) => ({
      id: n.id,
      x: i * 120,
      y: 100,
      label: n.content
    }))
    const edges = map.nodes
      .filter(n => n.parentId)
      .map(n => ({
        id: `${n.parentId}-${n.id}`,
        from: n.parentId as string,
        to: n.id
      }))
    setCanvasNodes(nodes)
    setCanvasEdges(edges)
  }, [map])

  useEffect(() => {
    if (!mapId) return
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loadMap(mapId, controller.signal)
      .then(data => setMap(data))
      .catch(err => { if (err.name !== 'AbortError') setError(err.message) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [mapId, trigger])

  const reload = useCallback(() => setTrigger(t => t + 1), [])

  const addNode = useCallback((parentId?: string) => {
    setMap(prev => {
      if (!prev) return prev
      const newNode: NodeData = { id: crypto.randomUUID(), content: '', parentId }
      return { ...prev, nodes: [...prev.nodes, newNode] }
    })
  }, [])

  const updateNode = useCallback((node: NodeData) => {
    setMap(prev => {
      if (!prev) return prev
      return { ...prev, nodes: prev.nodes.map(n => (n.id === node.id ? node : n)) }
    })
  }, [])

  const deleteNode = useCallback((nodeId: string) => {
    setMap(prev => {
      if (!prev) return prev
      return { ...prev, nodes: prev.nodes.filter(n => n.id !== nodeId) }
    })
  }, [])

  const save = useCallback(async () => {
    if (!map) return
    setSaving(true)
    setError(null)
    try {
      await saveMap(map)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [map])

  if (!mapId) return <div>No map specified</div>
  if (loading) return <div>Loading map...</div>
  if (!map) return (
    <div>
      <p>Error loading map: {error}</p>
      <button onClick={reload}>Retry</button>
    </div>
  )

  return (
    <div>
      {error && <p>Error: {error}</p>}
      <div>
        <label>
          Title:{' '}
          <input
            type="text"
            value={map.title}
            onChange={e => setMap(prev => prev ? { ...prev, title: e.target.value } : prev)}
            disabled={saving}
          />
        </label>
      </div>
      <MindmapCanvas nodes={canvasNodes} edges={canvasEdges} width={800} height={600} />
      <button onClick={() => addNode()} disabled={saving}>Add Root Node</button>
      <ul>
        {map.nodes.map(node => (
          <li key={node.id}>
            <input
              type="text"
              value={node.content}
              onChange={e => updateNode({ ...node, content: e.target.value })}
              disabled={saving}
            />
            <button onClick={() => addNode(node.id)} disabled={saving}>Add Child</button>
            <button onClick={() => deleteNode(node.id)} disabled={saving}>Delete</button>
          </li>
        ))}
      </ul>
      <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Map'}</button>
    </div>
  )
}
