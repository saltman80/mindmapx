import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './homepage'
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/payment" element={<BillingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
