const HomePage = lazy(() => import('./pages/HomePage'))
const DemoPage = lazy(() => import('./pages/DemoPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const SuccessPage = lazy(() => import('./pages/SuccessPage'))
const CancelPage = lazy(() => import('./pages/CancelPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
if (!stripeKey) {
  throw new Error('Missing environment variable: VITE_STRIPE_PUBLISHABLE_KEY')
}
const stripePromise: Promise<Stripe | null> = loadStripe(stripeKey)

function App(): JSX.Element {
  return (
    <React.StrictMode>
      <Elements stripe={stripePromise}>
        <Router>
          <ScrollToTop />
          <Navbar />
          <ErrorBoundary>
            <Suspense fallback={<div className="loading">Loading...</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/cancel" element={<CancelPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <Footer />
        </Router>
      </Elements>
    </React.StrictMode>
  )
}

export default App