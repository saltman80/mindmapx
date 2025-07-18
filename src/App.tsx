import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Homepage from './homepage'
import Header from './header'
import Footer from './footer'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Homepage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}
