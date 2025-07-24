import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import MindmapCanvas, { NodeData, EdgeData } from './MindmapCanvas'
import { authFetch } from '../authFetch'

interface Mindmap {
  id: string
  title?: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
  config?: object
}

export default function MapEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [mindmap, setMindmap] = useState<Mindmap | null>(null)
  const [error, setError] = useState(false)
  const [reloadFlag, setReloadFlag] = useState(0)
  const [nodes, setNodes] = useState<NodeData[]>([])

  useEffect(() => {
    if (!id) return
    let ignore = false

    authFetch(`/api/maps/${id}`)
      .then(async res => {
        if (!res.ok) {
          if (!ignore) setError(true)
          return
        }
        console.log('Map fetch response:', res.status)
        const json = await res.json()
        console.log('Map JSON:', json)
        if (!ignore) {
          console.log('[MapEditorPage] mindmap response:', json.map || json)
          setMindmap(json.map || json)
        }
      })
      .catch(() => {
        if (!ignore) setError(true)
      })

    return () => {
      ignore = true
    }
  }, [id, reloadFlag])

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    fetch(`/.netlify/functions/nodes?mindmapId=${id}`, { credentials: 'include', signal: controller.signal })
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (!Array.isArray(data)) return
        setNodes(data)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [id, reloadFlag])

  if (error) return <div>Error loading map. Failed to load map: 404</div>
  if (!mindmap) return <div>Loading mind map...</div>

  const edges: EdgeData[] = nodes
    .filter(n => n.parentId)
    .map(n => ({ id: n.id + '_edge', from: n.parentId!, to: n.id }))

  const handleAddNode = (node: NodeData) => {
    if (!id) return
    fetch('/.netlify/functions/nodes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...node, mindmapId: id })
    })
      .then(res => res.json())
      .then(data => {
        setNodes(prev => [...prev, { ...node, id: data.id || node.id }])
      })
      .catch(() => {})
  }

  if (nodes.length === 0 && edges.length === 0) {
    console.log('[mindmap] No nodes or edges found, rendering empty canvas')
  }

  console.log('mapData:', mindmap)

  const handleMoveNode = (node: NodeData) => {
    fetch(`/.netlify/functions/nodes/${node.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: node.x, y: node.y })
    }).catch(() => {})
  }

  const handleSaveLayout = useCallback(() => {
    nodes.forEach(n => {
      fetch(`/.netlify/functions/nodes/${n.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: n.x, y: n.y })
      }).catch(() => {})
    })
  }, [nodes])

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <button
          onClick={handleSaveLayout}
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
        >
          Save Layout
        </button>
        <MindmapCanvas
          nodes={nodes}
          edges={edges}
          onAddNode={handleAddNode}
          onMoveNode={handleMoveNode}
          showMiniMap
        />
      </main>
    </div>
  )
}
