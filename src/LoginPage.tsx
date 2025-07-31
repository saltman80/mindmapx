import { useAuth0 } from '@auth0/auth0-react'
import FaintMindmapBackground from '../FaintMindmapBackground'

const LoginPage = () => {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
    error,
  } = useAuth0()

  const signup = () =>
    login({
      authorizationParams: {
        screen_hint: 'signup',
        audience: 'https://mindxdo.netlify.app/api',
        scope: 'openid profile email',
      },
    })
  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } })

  if (isLoading) return <p>Loading...</p>

  return isAuthenticated ? (
    <div id="top" tabIndex={-1} style={{ scrollMarginTop: '114px' }}>
      <section className="section relative overflow-hidden login-page">
        <FaintMindmapBackground />
        <div className="form-card text-center">
          <p>Logged in as {user?.email}</p>
          <h1>User Profile</h1>
          <pre>{JSON.stringify(user, null, 2)}</pre>
          <button className="btn w-full" onClick={logout}>
            Logout
          </button>
        </div>
      </section>
    </div>
  ) : (
    <div id="top" tabIndex={-1} style={{ scrollMarginTop: '114px' }}>
      <section className="section relative overflow-hidden login-page">
        <FaintMindmapBackground />
        <div className="form-card text-center">
          {error && (
            <p className="text-red-600 mb-4" role="alert">
              {error.message}
            </p>
          )}
          <button className="btn w-full mb-4" onClick={signup}>
            Signup
          </button>
          <button
            className="btn w-full"
            onClick={() =>
              login({
                authorizationParams: {
                  audience: 'https://mindxdo.netlify.app/api',
                  scope: 'openid profile email',
                },
              })
            }
          >
            Login
          </button>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
