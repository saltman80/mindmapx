import { NavLink, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUser } from './lib/UserContext'

const mainLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/mindmaps', label: 'Mindmaps' },
  { to: '/todos', label: 'Todos' },
  { to: '/kanban', label: 'Kanban' },
  { to: '/team-members', label: 'Team Members' },
]

const accountLinks = [
  { to: '/profile', label: 'Profile' },
  { to: '/billing', label: 'Billing' },
  { to: '/account', label: 'Account' },
]

export default function SidebarNav(): JSX.Element {
  const navigate = useNavigate()
  const { setUser } = useUser()

  const [open, setOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > 768 : true
  )

  const handleSignOut = () => {
    document.cookie = 'token=; Max-Age=0; path=/'
    document.cookie = 'session=; Max-Age=0; path=/'
    setUser(null)
    navigate('/login')
  }

  const DESKTOP_WIDTH = 200
  const MOBILE_PERCENT = 0.35

  const [sidebarWidth, setSidebarWidth] = useState(DESKTOP_WIDTH)


  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth <= 768) {
        setSidebarWidth(window.innerWidth * MOBILE_PERCENT)
      } else {
        setSidebarWidth(DESKTOP_WIDTH)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  useEffect(() => {
    if (window.innerWidth <= 768 && open) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
  }, [open])

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: -(sidebarWidth - 40) }
  }

  return (
    <motion.aside
      className={`app-sidebar${open ? '' : ' closed'}`}
      style={{ width: sidebarWidth, ['--sidebar-width' as any]: `${sidebarWidth}px` }}
      animate={open ? 'open' : 'closed'}
      variants={sidebarVariants}
      transition={{ duration: 0.3 }}
    >
      <button
        type="button"
        className="sidebar-drawer-toggle"
        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span>{open ? '‹' : '›'}</span>
      </button>
      <nav>
        <ul>
          {mainLinks.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="account-links">
          {accountLinks.map(link => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => (isActive ? 'active' : undefined)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button type="button" className="signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </motion.aside>
  )
}
