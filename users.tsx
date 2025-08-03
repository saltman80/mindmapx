import { useEffect, useState } from 'react'
import AdminNav from './src/AdminNav'
import { useUser } from './src/lib/UserContext'
import { isAdmin } from './src/lib/isAdmin'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  status: string | null
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
    fetch('/api/users?skip=0&limit=100', {
      credentials: 'include',
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(json => {
        setUsers(json.data as User[])
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
      <h1>Users</h1>
      <AdminNav />
      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Date Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map(u => (
                <tr key={u.id}>
                  <td>{u.name || ''}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status || ''}</td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
