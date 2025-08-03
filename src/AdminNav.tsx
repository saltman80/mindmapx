import { NavLink } from 'react-router-dom'

const adminLinks = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/analytics', label: 'Analytics' }
]

export default function AdminNav(): JSX.Element {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <ul className="admin-nav-list">
        {adminLinks.map(link => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? ' admin-nav-link-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
