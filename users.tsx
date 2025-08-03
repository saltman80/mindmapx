import { useEffect, useState } from 'react'
import AdminNav from './src/AdminNav'
import { useUser } from './src/lib/UserContext'
import { isAdmin } from './src/lib/isAdmin'
import { authFetch } from './authFetch'

interface User {
  id: string
  email: string
  role: string
  created_at: string
}

export default function UsersPage(): JSX.Element {
  const { user } = useUser()
  if (!isAdmin(user)) {
    return <p>Forbidden</p>
  }
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    authFetch('/api/users?skip=0&limit=100', {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(json => {
        const data = Array.isArray(json.data) ? (json.data as User[]) : []
        setUsers(data)
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Unknown error')
        }
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  return (
    <div className="admin-users-page">
      <AdminNav />
      <h1>Users</h1>
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Date Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
