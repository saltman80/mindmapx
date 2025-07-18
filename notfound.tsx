import { Link, useNavigate } from 'react-router-dom'

export default function NotFound(): JSX.Element {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404</h1>
      <p>Oops! The page you're looking for doesn't exist.</p>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={handleGoBack} style={{ marginRight: '1rem' }}>
          Go Back
        </button>
        <Link to="/">Home</Link>
      </div>
    </div>
  )
}
