const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000,
      cacheTime: 600_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

const MindmapCanvas = lazy(() => import('./mindmapcanvas'))
const TodoDashboard = lazy(() => import('./tododashboard'))
const AboutModulePage = lazy(() => import('./aboutmodulepage'))
const Homepage = lazy(() => import('./homepage'))
const PaymentPage = lazy(() => import('./paymentpage'))
const LoginPage = lazy(() => import('./login'))

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: 20 }}>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

function ReactQueryDevtoolsLoader() {
  const [Devtools, setDevtools] = useState(null)
  useEffect(() => {
    import('@tanstack/react-query-devtools').then(mod => {
      setDevtools(() => mod.ReactQueryDevtools)
    })
  }, [])
  if (!Devtools) return null
  return <Devtools initialIsOpen={false} />
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/mindmap" element={<MindmapCanvas />} />
                <Route path="/todos" element={<TodoDashboard />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/about-module" element={<AboutModulePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
        {import.meta.env.DEV && <ReactQueryDevtoolsLoader />}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
