const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'About', href: '/about' },
  { name: 'Terms', href: '/terms' },
  { name: 'Privacy Policy', href: '/privacy-policy' }
]

const socialLinks = [
  { name: 'GitHub', href: 'https://github.com/your-username/your-repo' },
  { name: 'Twitter', href: 'https://twitter.com/your-username' }
]

export default function Footer(): JSX.Element {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="footer__container">
        <div className="footer__brand">
          <a href="/" className="footer__logo">
            Mindmap ? Todo
          </a>
        </div>
        <nav className="footer__nav" aria-label="Footer Navigation">
          <ul className="footer__nav-list">
            {navLinks.map(link => (
              <li key={link.href} className="footer__nav-item">
                <a href={link.href} className="footer__nav-link">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav className="footer__social" aria-label="Social Media">
          <ul className="footer__social-list">
            {socialLinks.map(link => (
              <li key={link.href} className="footer__social-item">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer__social-link"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="footer__copy">
          &copy; {year} Mindmap ? Todo. All rights reserved.
        </div>
      </div>
    </footer>
  )
}