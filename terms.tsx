import { Link } from 'react-router-dom'

export default function TermsOfService(): JSX.Element {
  return (
    <main className="container legal-page text-center py-lg">
      <h1 className="mb-lg">Terms of Service</h1>
      <p className="text-muted mb-lg">Last updated: July 10, 2024</p>
      <p className="mb-md">
        By using MindXdo you agree to the following terms. This demo site is for
        illustrative purposes only.
      </p>
      <p className="mb-md">
        Please read our <Link to="/privacy" className="text-primary">Privacy Policy</Link> to learn how
        we handle your data.
      </p>
      <p>
        If you have any questions feel free to contact support.
      </p>
    </main>
  )
}
