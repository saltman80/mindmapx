import FaintMindmapBackground from './FaintMindmapBackground'

const LoginPage = (): JSX.Element => {
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginFormValues>>({})
  const [submitError, setSubmitError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const validateForm = (vals: LoginFormValues): boolean => {
    const validationErrors: Partial<LoginFormValues> = {}
    if (!vals.email) {
      validationErrors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(vals.email)) {
        validationErrors.email = 'Invalid email address'
      }
    }
    if (!vals.password) {
      validationErrors.password = 'Password is required'
    } else if (vals.password.length < 6) {
      validationErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(validationErrors)
    return Object.keys(validationErrors).length === 0
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginFormValues]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    setSubmitError('')
    if (!validateForm(values)) return
    setIsLoading(true)
    const controller = new AbortController()
    abortControllerRef.current = controller

    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) {
          let errorMsg = 'Login failed'
          const contentType = response.headers.get('Content-Type') || ''
          if (contentType.includes('application/json')) {
            try {
              const errorData = await response.json()
              errorMsg = errorData.error || errorMsg
            } catch {
              // ignore parse error
            }
          }
          throw new Error(errorMsg)
        }
        const contentType = response.headers.get('Content-Type') || ''
        if (!contentType.includes('application/json')) {
          throw new Error('Invalid response from server')
        }
        try {
          return await response.json()
        } catch {
          throw new Error('Failed to parse server response')
        }
      })
      .then(() => {
        navigate('/dashboard')
      })
      .catch(err => {
        if ((err as any).name !== 'AbortError') {
          setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <section className="section relative overflow-hidden">
      <FaintMindmapBackground />
      <div className="form-card text-center">
        <img
          src="./assets/login.png"
          alt="Login"
          className="w-24 mx-auto mb-4"
        />
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      {submitError && (
        <div role="alert" aria-live="assertive" className="text-red-600 mb-4">
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={values.email}
            onChange={handleChange}
            className={`form-input${errors.email ? ' form-error' : ''}`}
            required
          />
          {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={values.password}
            onChange={handleChange}
            className={`form-input${errors.password ? ' form-error' : ''}`}
            required
            minLength={6}
          />
          {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn w-full"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      </div>
    </section>
  )
}

export default LoginPage
