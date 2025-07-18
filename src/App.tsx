import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from '../homepage'
import LoginPage from '../login'
import ResetPasswordPage from '../reset-password'
import AboutPage from '../about'
import MindmapDemo from '../mindmapdemo'
import TodoDemo from '../tododemo'
import DashboardPage from './DashboardPage'
import PaymentPage from '../paymentpage'
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
