const Header = (): JSX.Element => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    return scrollY.onChange((y) => {
      setIsScrolled(y > 50)
    })
  }, [scrollY])

  const handleLinkClick = () => {
    setMenuOpen(false)
  }

  return (
    <motion.header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          Mindmap ? Todo
        </Link>
        <nav className={`${styles.nav} ${menuOpen ? styles.open : ''}`}>
          <a href="#features" onClick={handleLinkClick}>
            Features
          </a>
          <a href="#demo" onClick={handleLinkClick}>
            Demo
          </a>
          <a href="#pricing" onClick={handleLinkClick}>
            Pricing
          </a>
          <a href="#contact" onClick={handleLinkClick}>
            Contact
          </a>
        </nav>
        <div className={styles.actions}>
          <Link to="/checkout" className={styles.cta}>
            Get Started
          </Link>
          <button
            className={`${styles.menuToggle} ${menuOpen ? styles.active : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}

export default Header