import { NavLink, useNavigate } from 'react-router-dom'
import React, { useState } from 'react'
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

  const SIDEBAR_WIDTH = 200

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: -SIDEBAR_WIDTH }
  }

  return (
    <motion.aside
      className={`app-sidebar${open ? '' : ' closed'}`}
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
