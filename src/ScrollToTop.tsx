import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop(): JSX.Element {
  const { pathname } = useLocation()
  useEffect(() => {
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
    const isDashboard = dashboardPaths.some(
      p => pathname === p || pathname.startsWith(p + '/')
    )
    if (isDashboard) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname])
  return null
}
