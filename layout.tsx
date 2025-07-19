const Layout = ({ children }: LayoutProps): JSX.Element => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = 'primary-navigation';
  const navRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && menuOpen) {
      setMenuOpen(false);
      buttonRef.current?.focus();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="layout">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header className="layout-header">
        <div className="layout-header-inner">
          <h1 className="layout-logo">MindXdo</h1>
          <button
            type="button"
            ref={buttonRef}
            className="layout-menu-button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className="layout-menu-icon">
              {menuOpen ? '✕' : '☰'}
            </span>
          </button>
          <nav
            id={navId}
            ref={navRef}
            className={`layout-nav${menuOpen ? ' layout-nav-open' : ''}`}
            role="navigation"
            aria-hidden={!menuOpen}
          >
            <ul className="layout-nav-list">
              <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/mindmap"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Mindmap
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/todos"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Todos
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/billing"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Billing
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Profile
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/purchase"
                className={({ isActive }) =>
                  `layout-nav-link${isActive ? ' layout-nav-link-active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Purchase
              </NavLink>
            </li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <div className="layout-footer-inner">
          &copy; {new Date().getFullYear()} MindXdo. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
