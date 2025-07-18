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
import PurchasePage from './PurchasePage'
import NotFound from './NotFound'
import Header from './header'
import Footer from './footer'
import ScrollToTop from './ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <ScrollToTop />
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
        <Route path="/purchase" element={<PurchasePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
