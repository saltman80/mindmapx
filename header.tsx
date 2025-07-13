function createDefaultMap() {
  return {
    id: null as string | null,
    title: 'Untitled Map',
    nodes: [] as unknown[],
    edges: [] as unknown[],
  }
}

const Header: React.FC = () => {
  const { map, setMap } = useContext(MindmapContext)
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const handleNewMap = () => {
    if (window.confirm('Start a new map? Unsaved changes will be lost.')) {
      setMap(createDefaultMap())
    }
  }

  const handleSaveMap = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/.netlify/functions/saveMap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(map),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to save map'
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }

      let data: any = {}
      const contentType = response.headers.get('Content-Type') || ''
      if (contentType.includes('application/json')) {
        data = await response.json()
      }

      setMap(prev => ({ ...prev, id: data.id }))
      toast.success('Map saved successfully')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Error saving map')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <header className="header">
      <Link to="/" className="header__logo">
        PlanScaler
      </Link>
      <div className="header__actions">
        <button className="header__button" onClick={handleNewMap}>
          New Map
        </button>
        <button className="header__button" onClick={handleSaveMap} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Map'}
        </button>
        <Link to="/gallery" className="header__button">
          Gallery
        </Link>
      </div>
    </header>
  )
}

export default Header