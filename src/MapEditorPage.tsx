import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import MindmapCanvas, { NodeData } from './MindmapCanvas'
import { authFetch } from '../authFetch'

interface Mindmap {
  id: string
  title?: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
  config?: object
}

function getSafeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export default function MapEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [mindmap, setMindmap] = useState<Mindmap | null>(null)
  const [error, setError] = useState(false)
  const [reloadFlag, setReloadFlag] = useState(0)

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

  if (error) return <div>Error loading map. Failed to load map: 404</div>
  if (!mindmap) return <div>Loading mind map...</div>

  const nodes = getSafeArray(mindmap?.nodes ?? mindmap?.data?.nodes)
  const edges = getSafeArray(mindmap?.edges ?? mindmap?.data?.edges)

  const handleAddNode = (node: NodeData) => {
    setMindmap(prev => {
      if (!prev) return prev
      const arr = getSafeArray(prev.nodes ?? (prev as any).data?.nodes)
      return { ...prev, nodes: [...arr, node] }
    })
    setReloadFlag(f => f + 1)
  }

  if (nodes.length === 0 && edges.length === 0) {
    console.log('[mindmap] No nodes or edges found, rendering empty canvas')
  }

  console.log('mapData:', mindmap)

  return (
    <div className="dashboard-layout">
      <main className="main-area">
        <MindmapCanvas
          nodes={nodes}
          edges={edges}
          onAddNode={handleAddNode}
        />
      </main>
    </div>
  )
}
