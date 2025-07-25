import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import MindmapCanvas, { NodeData, EdgeData } from './MindmapCanvas'
import { authFetch } from '../authFetch'

function FirstNodeModal({ onCreate }: { onCreate: (label: string) => void }) {
  const [label, setLabel] = useState('')
  return (
    <div className="modal-overlay">
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create Your First Node</h2>
        <input
          type="text"
          className="form-input"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Node title"
          required
        />
        <div style={{ marginTop: '1rem' }}>
          <button className="btn-primary" onClick={() => onCreate(label)}>
            Create Node
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [mapError, setMapError] = useState<string | null>(null)
  const [nodesError, setNodesError] = useState<string | null>(null)
  const [loadingMap, setLoadingMap] = useState(true)
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [reloadFlag, setReloadFlag] = useState(0)
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [showFirstNodeModal, setShowFirstNodeModal] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleReload = useCallback(() => setReloadFlag(p => p + 1), [])

  useEffect(() => {
    if (!id) return
    let ignore = false
    setLoadingMap(true)
    setMapError(null)

    authFetch(`/.netlify/functions/mapid/${id}`)
      .then(async res => {
        console.log('[MapEditorPage] map fetch status:', res.status)
        if (!res.ok) {
          if (!ignore) {
            setError(true)
            setMapError(`Failed to load map: ${res.status}`)
          }
          return
        }
        const json = await res.json().catch(err => {
          console.error('[MapEditorPage] invalid JSON for map', err)
          return null
        })
        if (!ignore) {
          const mapData = json?.map || json
          if (mapData && typeof mapData === 'object') {
            setMindmap(mapData as Mindmap)
          } else {
            setMindmap({ id: id!, title: 'Untitled Map' })
          }
        }
      })
      .catch(err => {
        console.error('[MapEditorPage] map fetch error:', err)
        if (!ignore) {
          setError(true)
          setMapError('Network error while loading map')
        }
      })
      .finally(() => {
        if (!ignore) setLoadingMap(false)
      })

    return () => {
      ignore = true
    }
  }, [id, reloadFlag])

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setLoadingNodes(true)
    setNodesError(null)

    fetch(`/.netlify/functions/nodes?mindmapId=${id}`, {
      credentials: 'include',
      signal: controller.signal
    })
      .then(async res => {
        console.log('[MapEditorPage] nodes fetch status:', res.status)
        if (!res.ok) {
          setError(true)
          setNodesError(`Failed to load nodes: ${res.status}`)
          setNodes([])
          return
        }
        const data = await res.json().catch(err => {
          console.error('[MapEditorPage] invalid JSON for nodes', err)
          return null
        })
        console.log('[nodes] data:', data)
        if (Array.isArray(data)) {
          setNodes(data)
        } else {
          setNodes([])
          setNodesError('Invalid nodes data')
        }
      })
      .catch(err => {
        console.error('[nodes] fetch error:', err)
        setError(true)
        setNodes([])
        setNodesError('Network error while loading nodes')
      })
      .finally(() => setLoadingNodes(false))

    return () => {
      controller.abort()
    }
  }, [id, reloadFlag])

  useEffect(() => {
    if (!loadingMap && !loadingNodes) {
      setLoaded(true)
      if (nodes.length === 0) setShowFirstNodeModal(true)
    }
  }, [loadingMap, loadingNodes, nodes])

  const safeNodes = Array.isArray(nodes) ? nodes : []

  const handleSaveLayout = useCallback(() => {
    safeNodes.forEach(n => {
      fetch(`/.netlify/functions/nodes/${n.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: n.x, y: n.y })
      }).catch(() => {})
    })
  }, [safeNodes])

  if (error) return <div>Error loading map.</div>
  if (!loaded) return <div>Loading mind map...</div>
  if (!mindmap || !mindmap.id) return <div>Invalid map.</div>


  const edges: EdgeData[] = safeNodes
    .filter(n => n.parentId)
    .map(n => ({ id: n.id + '_edge', from: n.parentId!, to: n.id }))
    .filter(edge => edge.from && edge.to)

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

  const handleCreateFirstNode = (label: string) => {
    if (!id) return
    const newNode = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      label,
      parentId: null,
    }
    fetch('/.netlify/functions/nodes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newNode, mindmapId: id })
    })
      .then(res => res.json())
      .then(data => {
        setNodes(prev => [...prev, { ...newNode, id: data.id } as NodeData])
        setShowFirstNodeModal(false)
      })
      .catch(err => {
        console.error('[CreateFirstNode] Failed to create node', err)
      })
  }


  if (safeNodes.length === 0 && edges.length === 0) {
    console.log('[mindmap] No nodes or edges found, rendering empty canvas')
  }

  if (typeof mindmap === 'object' && mindmap !== null) {
    console.log('mapData:', { id: mindmap.id, title: mindmap.title })
  }

  const handleMoveNode = (node: NodeData) => {
    fetch(`/.netlify/functions/nodes/${node.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: node.x, y: node.y })
    }).catch(() => {})
  }

  try {
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
            nodes={Array.isArray(nodes) ? nodes : []}
            edges={Array.isArray(edges) ? edges : []}
            onAddNode={handleAddNode}
            onMoveNode={handleMoveNode}
            showMiniMap
          />
          {nodesError && (
            <div className="error">
              {nodesError}{' '}
              <button onClick={handleReload}>Retry</button>
            </div>
          )}
          {loaded && nodes.length === 0 && showFirstNodeModal && (
            <FirstNodeModal onCreate={handleCreateFirstNode} />
          )}
        </main>
      </div>
    )
  } catch (err) {
    console.error('Error rendering MapEditorPage:', err)
    return <div>Error rendering mind map. Please refresh the page.</div>
  }
}
