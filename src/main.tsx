import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App'
import ErrorBoundary from './ErrorBoundary'
import './global.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Auth0Provider
      domain={import.meta.env.AUTH0_DOMAIN}
      clientId={import.meta.env.AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.AUTH0_AUDIENCE
      }}
    >
      <App />
    </Auth0Provider>
  </ErrorBoundary>
)
