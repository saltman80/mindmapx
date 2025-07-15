const Header = (): JSX.Element => {
  const [isProfileMenuOpen, setProfileMenuOpen] = useState(false)
  const [isMobileNavOpen, setMobileNavOpen] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const navItems: NavItem[] = user
    ? [
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
    : [{ label: 'Home', route: '/' }]

  const handleAvatarClick = (): void => {
    setProfileMenuOpen(prev => !prev)
  }

  const handleNavSelect = (route: string): void => {
    setProfileMenuOpen(false)
    setMobileNavOpen(false)
    navigate(route)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (avatarRef.current && !avatarRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (
        navRef.current &&
        toggleRef.current &&
        !navRef.current.contains(target) &&
        !toggleRef.current.contains(target)
      ) {
        setMobileNavOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
    setMobileNavOpen(false)
  }, [location.pathname])

  const initials = user?.name
    ?.split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/" aria-label="Home">
            <img
              src="./assets/placeholder.svg"
              alt="Mindxdo logo"
              className="header__logo-img"
            />
          </Link>
        </div>
        <button
          ref={toggleRef}
          className="header__toggle"
          type="button"
          onClick={() => setMobileNavOpen(prev => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isMobileNavOpen}
          aria-controls="primary-navigation"
        >
          <span className="header__toggle-bar" />
          <span className="header__toggle-bar" />
          <span className="header__toggle-bar" />
        </button>
        <nav
          id="primary-navigation"
          ref={navRef}
          className={`header__nav${isMobileNavOpen ? ' header__nav--open' : ''}`}
          aria-label="Main navigation"
        >
          <ul className="header__nav-list">
            {navItems.map(item => (
              <li key={item.route} className="header__nav-item">
                <NavLink
                  to={item.route}
                  className={({ isActive }) =>
                    `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
                  }
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="header__actions">
          {user ? (
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
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
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
                    onClick={() => handleNavSelect('/profile')}
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="header__dropdown-item"
                    onClick={() => {
                      logout()
                      handleNavSelect('/login')
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="header__login-link">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
