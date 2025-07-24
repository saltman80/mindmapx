import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import SidebarNav from './SidebarNav'
import MindmapCanvas from './MindmapCanvas'
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
        const json = await res.json()
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

  const handleAddNode = () => {
    setMindmap(prev => {
      if (!prev) return prev
      const arr = getSafeArray(prev.nodes ?? (prev as any).data?.nodes)
      const newNode = { id: uuidv4(), x: 0, y: 0, label: 'New Node' }
      return { ...prev, nodes: [...arr, newNode] }
    })
    setReloadFlag(f => f + 1)
  }

  if (nodes.length === 0 && edges.length === 0) {
    console.log('[mindmap] No nodes or edges found, rendering empty canvas')
  }

  console.log('mapData:', mindmap)

  return (
    <div className="dashboard-layout">
      <SidebarNav />
      <main className="main-area" style={{ position: 'relative' }}>
        <MindmapCanvas nodes={nodes} edges={edges} />
        {nodes.length === 0 && edges.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <p>No nodes yet.</p>
            <button type="button" onClick={handleAddNode} className="btn-primary">
              Add Node
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
