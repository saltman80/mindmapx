import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

const NotFound = (): JSX.Element => {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="not-found">
      <img src="/assets/logo.png" alt="MindXdo logo" className="not-found__logo" />
      <h1 className="not-found__title">404</h1>
      <p className="not-found__message">
        Oops, there is no page here! Try clicking back or return home.
      </p>
      <div className="not-found__actions">
        <button onClick={handleGoBack} className="btn">
          Go Back
        </button>
        <Link to="/" className="btn">
          Home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
