const MapSelector: React.FC<MapSelectorProps> = ({ selectedMapId, onSelectMap }) => {
  const [maps, setMaps] = useState<MapInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchMaps = async () => {
      try {
        const res = await fetch('/api/maps', { signal: controller.signal })
        if (!res.ok) throw new Error(`Fetch error: ${res.statusText}`)
        const data: MapInfo[] = await res.json()
        setMaps(data)
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchMaps()
    return () => {
      controller.abort()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const newId = maps.length && typeof maps[0].id === 'number'
      ? parseInt(value, 10)
      : (value as unknown as MapInfo['id'])
    onSelectMap(newId)
  }

  if (loading) return <div>Loading maps...</div>
  if (error) return <div>Error loading maps: {error}</div>
  if (maps.length === 0) return <div>No maps available.</div>

  return (
    <div>
      <label htmlFor="map-selector">Select a map:</label>
      <select
        id="map-selector"
        value={selectedMapId != null ? String(selectedMapId) : ''}
        onChange={handleChange}
      >
        <option value="" disabled>Select a map</option>
        {maps.map(map => (
          <option key={map.id} value={String(map.id)}>
            {map.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default MapSelector