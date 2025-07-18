import { Link } from 'react-router-dom'

export default function TermsOfService(): JSX.Element {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold mb-6">Terms of Service</h1>
      <p className="text-sm text-gray-600 mb-8">Last updated: July 10, 2024</p>
      <p className="mb-4">
        By using MindXdo you agree to the following terms. This demo site is for
        illustrative purposes only.
      </p>
      <p className="mb-4">
        Please read our <Link to="/privacy" className="text-blue-600">Privacy Policy</Link> to learn how
        we handle your data.
      </p>
      <p>
        If you have any questions feel free to contact support.
      </p>
    </main>
  )
}
