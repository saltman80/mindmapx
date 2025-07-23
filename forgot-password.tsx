function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    const trimmedEmail = email.trim()
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/.netlify/functions/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      })
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        try {
          await response.json()
        } catch {}
      }
      setSuccess('If an account with that email exists, you will receive instructions to reset your password.')
      setEmail('')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page">
      <h1>Forgot Password</h1>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          aria-invalid={!!error}
          aria-describedby={error ? 'email-error' : undefined}
        />
        <div aria-live="polite" aria-atomic="true">
          {error && <p id="email-error" className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}

export default ForgotPasswordPage