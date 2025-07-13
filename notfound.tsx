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
    <div className={styles.container}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.message}>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className={styles.actions}>
        <button onClick={handleGoBack} className={styles.button}>
          Go Back
        </button>
        <Link to="/" className={styles.homeLink}>
          Home
        </Link>
      </div>
    </div>
  )
}