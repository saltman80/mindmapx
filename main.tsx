function main(): void {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    console.error('Failed to find root element with id "root". Application initialization aborted.')
    return
  }

  const root = ReactDOM.createRoot(rootElement)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,    // 5 minutes
        cacheTime: 10 * 60 * 1000,   // 10 minutes
        retry: 1                     // retry failed queries once
      }
    }
  })

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  )
}

main()