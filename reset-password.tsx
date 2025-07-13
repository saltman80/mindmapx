const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('token') || ''
    setToken(t)
    if (!t) {
      setError('Invalid or missing reset token.')
    }
  }, [location.search])

  const validatePasswords = (pw: string, cpw: string): boolean => {
    if (pw.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    if (pw !== cpw) {
      setError('Passwords do not match.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }
    if (!validatePasswords(password, confirmPassword)) {
      return
    }
    setLoading(true)
    try {
      const fnPath = import.meta.env.VITE_NETLIFY_FUNCTIONS_PATH || '/.netlify/functions'
      const response = await fetch(`${fnPath}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password.')
      }
      setSuccess('Password reset successfully. You can now log in with your new password.')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (error) setError('')
    setPassword(e.target.value)
  }

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (error) setError('')
    setConfirmPassword(e.target.value)
  }

  return (
    <div className="reset-password-page">
      <h1>Reset Password</h1>
      {error && <div role="alert" className="error-message">{error}</div>}
      {success && <div role="status" className="success-message">{success}</div>}
      {!success && (
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
          </div>
          <button type="submit" disabled={loading || !token}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  )
}

export default ResetPasswordPage