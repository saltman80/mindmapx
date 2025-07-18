import { lazy, Suspense, useState, useEffect } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './errorboundary'
import Layout from './layout'
import LoadingSpinner from './loadingspinner'

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
const DashboardPage = lazy(() => import('./dashboard'))
const BillingPage = lazy(() => import('./billing'))
const ProfilePage = lazy(() => import('./profile'))
const AboutModulePage = lazy(() => import('./aboutmodulepage'))
const Homepage = lazy(() => import('./src/homepage'))
const PaymentPage = lazy(() => import('./paymentpage'))
const LoginPage = lazy(() => import('./login'))
const MapPage = lazy(() => import('./mapid'))
const TodoPage = lazy(() => import('./todoid'))
const TeamMembersPage = lazy(() => import('./teammembers'))

function MapPageWrapper() {
  const { mapId } = useParams()
  if (!mapId) return <Navigate to="/dashboard" replace />
  return <MapPage mapId={mapId} />
}

function TodoPageWrapper() {
  const { mindmapId } = useParams()
  if (!mindmapId) return <Navigate to="/dashboard" replace />
  return <TodoPage mindmapId={mindmapId} />
}

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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/billing" element={<BillingPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/team" element={<TeamMembersPage />} />
                <Route path="/mindmap" element={<MindmapCanvas />} />
                <Route path="/todos" element={<TodoDashboard />} />
                <Route path="/maps/:mapId" element={<MapPageWrapper />} />
                <Route path="/todos/:mindmapId" element={<TodoPageWrapper />} />
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
