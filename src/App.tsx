import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Homepage from '../homepage'
import AboutPage from '../about'
import MindmapDemo from '../mindmapdemo'
import TodoDemo from '../tododemo'
import Kanban from '../kanban'
import ResetPassword from '../reset-password'
import PrivacyPolicy from '../privacypolicy'
import TermsOfService from '../terms'
import CheckoutPage from '../checkout'

import LoginPage from './LoginPage'
import DashboardPage from './DashboardPage'
import PurchasePage from './PurchasePage'
import NotFound from './NotFound'
import Header from './header'
import Footer from './footer'
import SidebarNav from './SidebarNav'
import ScrollToTop from './ScrollToTop'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/mindmap-demo" element={<MindmapDemo />} />
      <Route path="/todo-demo" element={<TodoDemo />} />
      <Route path="/kanban" element={<Kanban />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/purchase" element={<PurchasePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function RouterContent() {
  const location = useLocation()
  const internal = /^\/(dashboard|mindmaps|todos)/.test(location.pathname)

  return internal ? (
    <div className="app-layout">
      <SidebarNav />
      <main className="app-content">
        <AppRoutes />
      </main>
    </div>
  ) : (
    <>
      <Header />
      <AppRoutes />
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <RouterContent />
    </BrowserRouter>
  )
}
