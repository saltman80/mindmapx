import { authFetch } from './authFetch'

function isSaveMapResponse(obj: any): obj is SaveMapResponse {
  return obj != null && typeof obj.id === 'string'
}

const SaveMapButton: React.FC<SaveMapButtonProps> = ({ serializeMap, mapId, onSaveComplete }) => {
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const isMounted = useRef(true)
  const controllerRef = useRef<AbortController | null>(null)
  const toast = useToast()

  useEffect(() => {
    return () => {
      isMounted.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const handleClick = useCallback(async () => {
    setIsSaving(true)
    controllerRef.current = new AbortController()
    try {
      const payload = { id: mapId, data: serializeMap() }
      const response = await authFetch('/.netlify/functions/saveMap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controllerRef.current.signal,
      })
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`)
      }
      const result = await response.json()
      if (!isSaveMapResponse(result)) {
        throw new Error('Invalid saveMap response')
      }
      const newId = result.id
      onSaveComplete?.(newId)
      toast.success('Map saved successfully.')
    } catch (error: any) {
      console.error('SaveMapButton error:', error)
      if (error.name === 'AbortError') return
      toast.error('Failed to save map. Please try again.')
    } finally {
      if (isMounted.current) {
        setIsSaving(false)
      }
      controllerRef.current = null
    }
  }, [serializeMap, mapId, onSaveComplete, toast])

  return (
    <button onClick={handleClick} disabled={isSaving}>
      {isSaving ? 'Saving...' : 'Save Map'}
    </button>
  )
}

export default SaveMapButton