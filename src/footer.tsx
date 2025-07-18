import { Link } from 'react-router-dom'

const BRAND_NAME = 'MindXdo'
const CURRENT_YEAR = new Date().getFullYear();
const FOOTER_LINKS = [
  { label: 'Terms of Service', href: '/terms', external: false },
  { label: 'Privacy Policy', href: '/privacy', external: false },
  { label: 'Hosted on Netlify', href: 'https://www.netlify.com', external: true },
];

function Footer(): JSX.Element {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__content">
        <p>&copy; {CURRENT_YEAR} {BRAND_NAME}. All rights reserved.</p>
        <nav aria-label="Footer navigation">
          <ul className="footer__links">
            {FOOTER_LINKS.map(({ label, href, external }) => (
              <li key={label}>
                {external ? (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </a>
                ) : (
                  <Link to={href}>
                    {label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
