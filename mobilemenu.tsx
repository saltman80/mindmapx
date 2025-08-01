import { useState, useEffect, useRef, useCallback } from 'react'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
]

const DesktopMenu = (): JSX.Element => (
  <nav className="desktop-menu" aria-label="Desktop">
    <ul className="desktop-menu__list">
      {navItems.map(item => (
        <li key={item.href} className="desktop-menu__item">
          <a href={item.href} className="desktop-menu__link">
            {item.label}
          </a>
        </li>
      ))}
    </ul>
    <button
      type="button"
      className="desktop-menu__login"
      onClick={() => {
        window.location.href = '/login'
      }}
    >
      Login
    </button>
  </nav>
)

const MobileMenu = (): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const firstLinkRef = useRef<HTMLAnchorElement>(null)
  const lastLinkRef = useRef<HTMLAnchorElement>(null)

  const toggleMenu = useCallback(() => {
    setIsOpen(open => !open)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        toggleMenu()
      }
      if (e.key === 'Tab' && isOpen && firstLinkRef.current && lastLinkRef.current) {
        if (e.shiftKey) {
          if (document.activeElement === firstLinkRef.current) {
            e.preventDefault()
            lastLinkRef.current.focus()
          }
        } else {
          if (document.activeElement === lastLinkRef.current) {
            e.preventDefault()
            firstLinkRef.current.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, toggleMenu])

  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      firstLinkRef.current.focus()
    }
  }, [isOpen])

  return (
    <nav className="mobile-menu" role="navigation" aria-label="Mobile">
      <button
        type="button"
        className="mobile-menu__button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        onClick={toggleMenu}
      >
        {isOpen ? <CloseIcon /> : <HamburgerIcon />}
      </button>
      {isOpen && (
        <div
          className="mobile-menu__overlay"
          role="dialog"
          aria-modal="true"
          onClick={e => {
            if (e.target === e.currentTarget) {
              toggleMenu()
            }
          }}
          ref={overlayRef}
        >
          <ul className="mobile-menu__list" role="menu">
            {navItems.map((item, idx) => (
              <li key={item.href} className="mobile-menu__item">
                <a
                  href={item.href}
                  className="mobile-menu__link"
                  role="menuitem"
                  onClick={toggleMenu}
                  ref={el => {
                    if (idx === 0) firstLinkRef.current = el
                    if (idx === navItems.length - 1) lastLinkRef.current = el
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mobile-menu__login"
            onClick={() => {
              toggleMenu()
              window.location.href = '/login'
            }}
          >
            Login
          </button>
          <button
            type="button"
            className="mobile-menu__close"
            aria-label="Close menu"
            onClick={toggleMenu}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </nav>
  )
}

const HamburgerIcon = (): JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect y="4" width="24" height="2" rx="1" fill="currentColor" />
    <rect y="11" width="24" height="2" rx="1" fill="currentColor" />
    <rect y="18" width="24" height="2" rx="1" fill="currentColor" />
  </svg>
)

const CloseIcon = (): JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const Menu = (): JSX.Element => (
  <>
    <DesktopMenu />
    <MobileMenu />
  </>
)

export default Menu