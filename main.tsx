function renderApp(): void {
  const container = document.getElementById('root')
  if (!container) throw new Error('Root element not found')
  const root = createRoot(container)
  const basename = import.meta.env.BASE_URL || '/'
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter basename={basename}>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

function renderError(error: unknown): void {
  console.error('Application failed to render:', error)
  const container = document.getElementById('root')
  if (!container) return
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '1rem' }}>
        <h1>Something went wrong</h1>
        <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          {error instanceof Error ? error.stack || error.message : String(error)}
        </pre>
      </div>
    </React.StrictMode>
  )
}

function main(): void {
  try {
    renderApp()
  } catch (error) {
    renderError(error)
  }
}

main()