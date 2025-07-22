import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from '../homepage'
import AboutPage from '../about'
import MindmapDemo from '../mindmapdemo'
import TodoDemo from '../tododemo'
import Kanban from '../kanban'
import MindmapsPage from './MindmapsPage'
import TodosPage from './TodosPage'
import KanbanBoardsPage from './KanbanBoardsPage'
import ProjectWorkspace from '../ProjectWorkspace'
import TodoDetail from '../TodoDetail'
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
      <Route path="/workspace" element={<ProjectWorkspace />} />
      <Route path="/todo/:id" element={<TodoDetail />} />
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

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <ScrollToTop />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  )
}
