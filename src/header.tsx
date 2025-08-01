import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Drawer } from '../drawer'
import { useUser } from './lib/UserContext'

const normalizePath = (path: string): string =>
  path.replace(/\/+$/, '') || '/'

export interface NavItem {
  label: string
  route: string
}

const Header = (): JSX.Element => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isMenuOpen, setMenuOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const isAuthenticated = !!user
  const marketingItems: NavItem[] = [
    { label: 'Home', route: '/' },
    { label: 'About', route: '/about' },
    { label: 'Mindmap', route: '/mindmap-demo' },
    { label: 'Todo', route: '/todo-demo' },
    { label: 'KanBan', route: '/kanban-demo' },
    { label: 'Purchase', route: '/purchase' },
  ]

  const navItems: NavItem[] = isAuthenticated
    ? [
        ...marketingItems,
        { label: 'Dashboard', route: '/dashboard' },
        { label: 'Mindmaps', route: '/mindmaps' },
        { label: 'Todos', route: '/todos' },
        ...(user.role === 'admin'
          ? [
              { label: 'Users', route: '/admin/users' },
              { label: 'Payments', route: '/admin/payments' },
          { label: 'Analytics', route: '/admin/analytics' },
            ]
          : []),
      ]
    : [...marketingItems]

  const handleAvatarClick = (): void => {
    setProfileMenuOpen(prev => !prev)
  }

  const handleNavSelect = (route: string): void => {
    setProfileMenuOpen(false)
    setMenuOpen(false)

    if (location.pathname !== route) {
      navigate(route)
    }

    const marketingPaths = [
      '/',
      '/about',
      '/mindmap-demo',
      '/todo-demo',
      '/kanban-demo',
      '/purchase',
      '/login'
    ]
    if (marketingPaths.includes(route)) {
      setTimeout(() => {
        const topAnchor = document.getElementById('top')
        if (topAnchor) {
          topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
      }, 50)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (avatarRef.current && !avatarRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      // Close the menu if a click happens outside the header while it is open
      if (isMenuOpen && !(event.target as Node).closest('header')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
    setMenuOpen(false)
  }, [location.pathname])

  const initials = user?.name
    ?.split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <>
      <header className="header">
        <div className="header__container">
          <div className="header__logo">
            <Link to="/" aria-label="Home">
              <img
                src="/assets/logo.png"
                alt="MindXdo logo"
                className="header__logo-img"
              />
            </Link>
          </div>
          {isAuthenticated && (
            <button
              className="header__toggle"
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="header__toggle-bar" />
              <span className="header__toggle-bar" />
              <span className="header__toggle-bar" />
            </button>
          )}

          <nav className="header__nav" aria-label="Primary">
            <ul className="header__nav-list">
              {navItems.map(item => (
                <li key={item.route} className="header__nav-item">
                  <NavLink
                    to={item.route}
                    className={({ isActive }) =>
                      `header__nav-link${
                        isActive ? ' header__nav-link--active' : ''
                      }`
                    }
                    onClick={e => {
                      e.preventDefault()
                      handleNavSelect(item.route)
                    }}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className={`header__actions${isAuthenticated ? '' : ' header__actions--marketing'}`}> 
          {!isAuthenticated && (
            <button
              className="header__toggle"
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              aria-label="Toggle navigation"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="header__toggle-bar" />
              <span className="header__toggle-bar" />
              <span className="header__toggle-bar" />
            </button>
          )}
          {isAuthenticated ? (
            <div className="header__avatar-container" ref={avatarRef}>
              <button
                id="profile-menu-button"
                className="header__avatar"
                type="button"
                onClick={handleAvatarClick}
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
                aria-controls="profile-menu"
              >
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={`${user.name}'s avatar`}
                    className="header__avatar-image"
                  />
                ) : (
                  <span className="header__avatar-initials">{initials}</span>
                )}
              </button>
              {isProfileMenuOpen && (
                <div
                  id="profile-menu"
                  className="header__dropdown"
                  role="menu"
                  aria-labelledby="profile-menu-button"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="header__dropdown-item"
                    onClick={e => {
                      e.preventDefault()
                      handleNavSelect('/profile')
                    }}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="header__dropdown-item"
                    onClick={() => {
                      document.cookie = 'session=; Max-Age=0; Path=/'
                      handleNavSelect('/login')
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="header__login-link"
                onClick={e => {
                  e.preventDefault()
                  navigate('/login')
                }}
              >
                Login
              </button>
            </>
          )}
          </div>
        </div>
      </header>
      <Drawer
        isOpen={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
      >
          <nav id="mobile-navigation">
            <ul className="header__nav-list header__nav-list--vertical">
              {navItems.map(item => (
                <li key={item.route} className="header__nav-item">
                  <NavLink
                  to={item.route}
                  className={({ isActive }) =>
                    `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
                  }
                  onClick={e => {
                    e.preventDefault()
                    handleNavSelect(item.route)
                  }}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  )
}

export default Header
