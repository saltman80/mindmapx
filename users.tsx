import AdminNav from './src/AdminNav'

export default function UsersPage(): JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  const [searchInput, setSearchInput] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  const loading = isFetching || isDeactivating

  const fetchUsers = useCallback(async (params: QueryParams, signal?: AbortSignal): Promise<number> => {
    setIsFetching(true)
    setError('')
    try {
      const query = new URLSearchParams()
      query.append('page', params.page.toString())
      query.append('pageSize', params.pageSize.toString())
      if (params.search) query.append('search', params.search)
      const res = await fetch(`/api/users?${query.toString()}`, { signal })
      if (!res.ok) throw new Error(`Error fetching users: ${res.statusText}`)
      const data = (await res.json()) as {
        users: Array<Omit<User, 'createdAt'> & { created_at: string }>
        total: number
      }
      const mapped = data.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.created_at,
      }))
      setUsers(mapped)
      setTotal(data.total)
      return data.total
    } catch (e: any) {
      if (e.name === 'AbortError') throw e
      setError(e.message || 'Unknown error')
      return -1
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchInput])

  useEffect(() => {
    const controller = new AbortController()
    const doFetch = async () => {
      try {
        const totalCount = await fetchUsers({ page, pageSize, search }, controller.signal)
        if (totalCount >= 0) {
          const newTotalPages = Math.ceil(totalCount / pageSize)
          if (page > newTotalPages) {
            setPage(newTotalPages > 0 ? newTotalPages : 1)
          }
        }
      } catch {
        // aborted or error already handled
      }
    }
    doFetch()
    return () => {
      controller.abort()
    }
  }, [fetchUsers, page, pageSize, search])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
  }

  const handleEditUser = useCallback((user: User) => {
    navigate(`/users/edit/${user.id}`)
  }, [navigate])

  const handleDeactivateUsers = useCallback(
    async (userIds: string[]) => {
      if (userIds.length === 0) return
      if (!window.confirm('Are you sure you want to deactivate selected users?')) return
      setIsDeactivating(true)
      setError('')
      try {
        const res = await fetch('/api/users/deactivate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userIds }),
        })
        if (!res.ok) throw new Error(`Error deactivating users: ${res.statusText}`)
        setSelectedUserIds(new Set())
        await fetchUsers({ page, pageSize, search })
      } catch (e: any) {
        setError(e.message || 'Unknown error')
      } finally {
        setIsDeactivating(false)
      }
    },
    [fetchUsers, page, pageSize, search]
  )

  const handleToggleSelect = (id: string) => {
    setSelectedUserIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(users.map(u => u.id)))
    }
  }

  const totalPages = Math.ceil(total / pageSize)
  const goToPrevious = () => setPage(p => Math.max(p - 1, 1))
  const goToNext = () => setPage(p => Math.min(p + 1, totalPages))

  return (
    <div>
      <h1>Users</h1>
      <AdminNav />
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchInput}
          onChange={handleSearchChange}
          disabled={loading}
          className="form-input"
        />
        <button
          onClick={() => handleDeactivateUsers(Array.from(selectedUserIds))}
          disabled={selectedUserIds.size === 0 || loading}
          style={{ marginLeft: 8 }}
        >
          Deactivate Selected
        </button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={selectedUserIds.size > 0 && selectedUserIds.size === users.length}
                onChange={handleSelectAll}
                disabled={loading}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(user.id)}
                  onChange={() => handleToggleSelect(user.id)}
                  disabled={loading}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.status}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEditUser(user)} disabled={loading}>
                  Edit
                </button>
                <button
                  onClick={() => handleDeactivateUsers([user.id])}
                  disabled={loading}
                  style={{ marginLeft: 8 }}
                >
                  Deactivate
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center' }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ marginTop: 16 }}>
        <button onClick={goToPrevious} disabled={page === 1 || loading}>
          Previous
        </button>
        <span style={{ margin: '0 8px' }}>
          Page {page} of {totalPages || 1}
        </span>
        <button onClick={goToNext} disabled={page === totalPages || loading}>
          Next
        </button>
      </div>
    </div>
  )
}