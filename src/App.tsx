import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from '../homepage'
import AboutPage from '../about'
import MindmapDemo from '../mindmapdemo'
import TodoDemo from '../tododemo'
import ResetPassword from '../reset-password'
import PrivacyPolicy from '../privacypolicy'
import TermsOfService from '../terms'
import CheckoutPage from '../checkout'

import LoginPage from './LoginPage'
import DashboardPage from './DashboardPage'
import BillingPage from './BillingPage'
import NotFound from './NotFound'
import Header from './header'
import Footer from './footer'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/mindmap-demo" element={<MindmapDemo />} />
        <Route path="/todo-demo" element={<TodoDemo />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/payment" element={<BillingPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
