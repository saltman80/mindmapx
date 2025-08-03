import { NavLink } from 'react-router-dom'

const adminLinks = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/analytics', label: 'Analytics' }
]

export default function AdminNav(): JSX.Element {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <ul>
        {adminLinks.map(link => (
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
    </nav>
  )
}
