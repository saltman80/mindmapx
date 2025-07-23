import { authFetch } from './authFetch'

const AboutModulePage: React.FC = () => {
  const { moduleId } = useParams<{ moduleId: string }>()
  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setModule(null)

    if (!moduleId) {
      setError('Module ID is missing in the URL.')
      setLoading(false)
      return
    }

    const controller = new AbortController()
    let isMounted = true

    const fetchModule = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setLoading(false)
          return
        }
        const response = await authFetch(
          `/.netlify/functions/get-module?moduleId=${encodeURIComponent(moduleId)}`,
          { signal: controller.signal }
        )

        if (response.status === 404) {
          if (isMounted) {
            setModule(null)
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to load module (status: ${response.status})`)
        }

        const data: Module = await response.json()
        if (isMounted) {
          setModule(data)
        }
      } catch (err) {
        if ((err as any).name !== 'AbortError' && isMounted) {
          setError(err instanceof Error ? err.message : 'Unexpected error')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchModule()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [moduleId])

  if (loading) {
    return (
      <main aria-busy="true">
        <p>Loading module details...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main role="alert">
        <p>Error: {error}</p>
        <Link to="/modules">Go back to modules list</Link>
      </main>
    )
  }

  if (!module) {
    return (
      <main>
        <p>Module not found.</p>
        <Link to="/modules">Return to modules list</Link>
      </main>
    )
  }

  return (
    <main className="about-module-page">
      <header>
        <Link to="/modules">? Back to Modules</Link>
        <h1>About "{module.name}"</h1>
      </header>
      <section>
        <h2>Description</h2>
        <p>{module.description}</p>
      </section>
      <section>
        <h2>Details</h2>
        <ul>
          <li><strong>Version:</strong> {module.version}</li>
          <li><strong>Author:</strong> {module.author}</li>
          <li><strong>Created:</strong> {new Date(module.createdAt).toLocaleString()}</li>
          <li><strong>Last Updated:</strong> {new Date(module.updatedAt).toLocaleString()}</li>
        </ul>
      </section>
    </main>
  )
}

export default AboutModulePage