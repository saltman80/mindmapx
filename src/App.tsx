import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Homepage from '../homepage'
import AboutPage from '../about'
import MindmapDemo from '../mindmapdemo'
import TodoDemo from '../tododemo'
import Kanban from '../kanban'
import MindmapsPage from './MindmapsPage'
import TodosPage from './TodosPage'
import KanbanBoardsPage from './KanbanBoardsPage'
import KanbanBoardPage from './KanbanBoardPage'
import ProjectWorkspace from '../ProjectWorkspace'
import MapEditorPage from './MapEditorPage'
import TodoEditorPage from './TodoEditorPage'
import TodoDetail from '../TodoDetail'
import TodosCanvasPage from './TodosCanvasPage'
import TeamMembers from '../teammembers'
import ProfilePage from '../profile'
import BillingPage from '../billing'
import AccountPage from '../account'
import ResetPassword from '../reset-password'
import PrivacyPolicy from '../privacypolicy'
import TermsOfService from '../terms'
import CheckoutPage from '../checkout'
import TrialExpired from '../trialexpired'
import SetPassword from '../set-password'
import TrialRegister from '../trial-register'
import PurchaseRegister from '../purchase-register'

import LoginPage from '../login'
import DashboardPage from './DashboardPage'
import PurchasePage from './PurchasePage'
import NotFound from './NotFound'
import Header from './header'
import Footer from './footer'
import ScrollToTop from './ScrollToTop'
import SidebarNav from './SidebarNav'
import ProtectedRoute from './ProtectedRoute'
import UpgradeRequired from '../upgrade-required'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/mindmap-demo" element={<MindmapDemo />} />
      <Route path="/todo-demo" element={<TodoDemo />} />
      <Route path="/kanban-demo" element={<Kanban />} />
      <Route path="/mindmaps" element={<ProtectedRoute><MindmapsPage /></ProtectedRoute>} />
      <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
      <Route path="/kanban" element={<ProtectedRoute><KanbanBoardsPage /></ProtectedRoute>} />
      <Route path="/kanban/:id" element={<ProtectedRoute><KanbanBoardPage /></ProtectedRoute>} />
      <Route path="/maps/:id" element={<ProtectedRoute><MapEditorPage /></ProtectedRoute>} />
      <Route path="/workspace" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
      <Route path="/todo/:id" element={<ProtectedRoute><TodoDetail /></ProtectedRoute>} />
      <Route path="/todos/:id" element={<ProtectedRoute><TodosCanvasPage /></ProtectedRoute>} />
      <Route path="/todo-canvas" element={<ProtectedRoute><TodoEditorPage /></ProtectedRoute>} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/register" element={<TrialRegister />} />
      <Route path="/purchase-register" element={<PurchaseRegister />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/team-members" element={<ProtectedRoute><TeamMembers /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/purchase" element={<PurchasePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/upgrade-required" element={<UpgradeRequired />} />
      <Route path="/trial-expired" element={<TrialExpired />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function AppLayout() {
  const location = useLocation()
  const dashboardPaths = [
    '/dashboard',
    '/mindmaps',
    '/todos',
    '/kanban',
    '/team-members',
    '/profile',
    '/billing',
    '/account',
    '/maps',
    '/todo-canvas'
  ]
  const isDashboard = dashboardPaths.some(path =>
    location.pathname === path || location.pathname.startsWith(path + '/')
  )

  useEffect(() => {
    if (isDashboard) {
      document.body.classList.remove('marketing')
    } else {
      document.body.classList.add('marketing')
    }
  }, [isDashboard])

  return isDashboard ? (
    <div className="app-layout">
      <SidebarNav />
      <div className="app-content">
        <AppRoutes />
      </div>
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
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <AppLayout />
    </BrowserRouter>
  )
}
