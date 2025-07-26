import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import MindmapCanvas from './MindmapCanvas'
import type { NodeData, EdgeData } from '../mindmapTypes'
import { authFetch } from '../authFetch'
import LoadingSpinner from '../loadingspinner'

interface Mindmap {
  id: string
  title?: string
  description?: string
  nodes?: unknown[]
  edges?: unknown[]
  config?: object
}

interface Transform {
  x: number
  y: number
  k: number
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
  const [nodes, setNodes] = useState<NodeData[] | null>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
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
            const t = (mapData as any).config?.transform
            if (
              t &&
              typeof t.x === 'number' &&
              typeof t.y === 'number' &&
              typeof t.k === 'number'
            ) {
              setTransform({ x: t.x, y: t.y, k: t.k })
            }
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
        const validNodes = Array.isArray(data?.nodes)
          ? data.nodes
          : Array.isArray(data)
            ? data
            : []
        if (!Array.isArray(data?.nodes) && !Array.isArray(data)) {
          setNodesError('Invalid nodes data')
        }
        setNodes(validNodes)
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
    }
  }, [loadingMap, loadingNodes])

  const safeNodes = Array.isArray(nodes) ? nodes : []

  const handleSaveLayout = useCallback(() => {
    if (!Array.isArray(safeNodes) || !mindmap?.id) return
    safeNodes.forEach(n => {
      fetch(`/.netlify/functions/nodes/${n.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: n.x, y: n.y })
      }).catch(() => {})
    })
    fetch(`/.netlify/functions/update/mindmap/${mindmap.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: { ...(mindmap.config || {}), transform } })
    }).catch(() => {})
  }, [safeNodes, mindmap, transform])

  const edges: EdgeData[] = Array.isArray(safeNodes)
    ? safeNodes
        .filter(n => n.parentId)
        .map(n => ({ id: n.id + '_edge', from: n.parentId!, to: n.id }))
        .filter(edge => edge.from && edge.to)
    : []



  const handleAddNode = (node: NodeData) => {
    if (!id) return
    fetch('/.netlify/functions/nodes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...node, mindmapId: id })
    })
      .then(async res => {
        if (!res.ok) {
          throw new Error(`Failed to create node: ${res.status}`)
        }
        const data = await res.json()
        setNodes(prev => [...prev, { ...node, id: data.id || node.id }])
      })
      .catch(err => {
        console.error('[handleAddNode] error', err)
        // fall back to client-side id so the user can continue working
        const fallbackId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
        setNodes(prev => [...prev, { ...node, id: node.id || fallbackId }])
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

  const handleTransformChange = useCallback(
    (t: Transform) => {
      setTransform(t)
      setMindmap(prev =>
        prev ? { ...prev, config: { ...(prev.config || {}), transform: t } } : prev
      )
    },
    []
  )

  if (error) return <div>Error loading map.</div>
  if (nodes === null || !loaded) return <LoadingSpinner />
  if (!mindmap || !mindmap.id) return <div>Invalid map.</div>

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
            initialTransform={transform}
            onTransformChange={handleTransformChange}
            showMiniMap
            mindmapId={mindmap.id}
          />
          {safeNodes.length === 0 && null}
          {nodesError && (
            <div className="error">
              {nodesError}{' '}
              <button onClick={handleReload}>Retry</button>
            </div>
          )}
          {mapError && (
            <div className="error">
              {mapError}{' '}
              <button onClick={handleReload}>Retry</button>
            </div>
          )}
        </main>
      </div>
    )
  } catch (err) {
    console.error('Error rendering MapEditorPage:', err)
    return <div>Error rendering mind map. Please refresh the page.</div>
  }
}
