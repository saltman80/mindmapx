import { NavLink, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from './useAuth'

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
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [open, setOpen] = useState(true)

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  const DESKTOP_WIDTH = 200
  const MOBILE_PERCENT = 0.35

  const [sidebarWidth, setSidebarWidth] = useState(DESKTOP_WIDTH)

  const metrics = [
    { label: 'Mindmaps', value: '1/10' },
    { label: 'Todo Lists', value: '0/100' },
    { label: 'Kanban Boards', value: '0/10' },
    { label: 'AI Automations', value: '0/25 this month' }
  ]

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

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: -(sidebarWidth - 20) }
  }

  return (
    <motion.aside
      className={`app-sidebar${open ? '' : ' closed'}`}
      style={{ width: sidebarWidth }}
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
      <table className="sidebar-metrics">
        <tbody>
          {metrics.map(m => (
            <tr key={m.label}>
              <td className="metric-label">{m.label}</td>
              <td className="metric-value">{m.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
