import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './global.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: `${window.location.origin}/dashboard`,
          scope: 'openid profile email',
          audience: 'https://mindxdo.netlify.app/api'
        }}
      >
        <App />
      </Auth0Provider>
    </ErrorBoundary>
  </StrictMode>
)
