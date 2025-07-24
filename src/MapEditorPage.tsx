import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import SidebarNav from './SidebarNav'
import MindmapCanvas from './MindmapCanvas'
import { authFetch } from '../authFetch'

interface Mindmap {
  id: string
  title: string
  description?: string
  config?: object
}

export default function MapEditorPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [mindmap, setMindmap] = useState<Mindmap | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    let ignore = false

    authFetch(`/.netlify/functions/mindmaps?id=${id}`)
      .then(async res => {
        if (!res.ok) {
          if (!ignore) setError(true)
          return
        }
        const json = await res.json()
        if (!ignore) setMindmap(json.map || json)
      })
      .catch(() => {
        if (!ignore) setError(true)
      })

    return () => {
      ignore = true
    }
  }, [id])

  if (error) return <div>Error loading map. Failed to load map: 404</div>
  if (!mindmap) return <div>Loading mind map...</div>

  return (
    <div className="dashboard-layout">
      <SidebarNav />
      <main className="main-area">
        <MindmapCanvas mindmap={mindmap} />
      </main>
    </div>
  )
}
