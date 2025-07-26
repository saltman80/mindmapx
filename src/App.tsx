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

import LoginPage from './LoginPage'
import DashboardPage from './DashboardPage'
import PurchasePage from './PurchasePage'
import NotFound from './NotFound'
import Header from './header'
import Footer from './footer'
import ScrollToTop from './ScrollToTop'
import SidebarNav from './SidebarNav'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/mindmap-demo" element={<MindmapDemo />} />
      <Route path="/todo-demo" element={<TodoDemo />} />
      <Route path="/kanban-demo" element={<Kanban />} />
      <Route path="/mindmaps" element={<MindmapsPage />} />
      <Route path="/todos" element={<TodosPage />} />
      <Route path="/kanban" element={<KanbanBoardsPage />} />
      <Route path="/kanban/:id" element={<KanbanBoardPage />} />
      <Route path="/maps/:id" element={<MapEditorPage />} />
      <Route path="/workspace" element={<ProjectWorkspace />} />
      <Route path="/todo/:id" element={<TodoDetail />} />
      <Route path="/todos/:id" element={<TodosCanvasPage />} />
      <Route path="/todo-canvas" element={<TodoEditorPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/team-members" element={<TeamMembers />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/billing" element={<BillingPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/purchase" element={<PurchasePage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
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
