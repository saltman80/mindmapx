import { useState, useEffect, useRef, useCallback, ChangeEvent, FormEvent } from 'react'
import { Link } from 'react-router-dom'

export default function DashboardPage(): JSX.Element {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState<boolean>(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const baseTabs: { key: TabKey; label: string }[] = [
    { key: 'maps', label: 'Maps' },
    { key: 'todos', label: 'Todos' },
  ]
  const adminTabs: { key: TabKey; label: string }[] = [
    { key: 'maps', label: 'Maps' },
    { key: 'todos', label: 'Todos' },
    { key: 'users', label: 'Users' },
    { key: 'payments', label: 'Payments' },
    { key: 'analytics', label: 'Analytics' },
  ]
  const tabs = summary?.isAdmin ? adminTabs : baseTabs

  const [activeTab, setActiveTab] = useState<TabKey>('maps')
  const [items, setItems] = useState<Item[]>([])
  const [itemsLoading, setItemsLoading] = useState<boolean>(false)
  const [itemsError, setItemsError] = useState<string | null>(null)

  const itemsControllerRef = useRef<AbortController | null>(null)

  const [showModal, setShowModal] = useState<boolean>(false)
  const [createType, setCreateType] = useState<'map' | 'todo'>('map')
  const [formData, setFormData] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  })

  const modalRef = useRef<HTMLDivElement | null>(null)

  const openCreateModal = useCallback((type: 'map' | 'todo') => {
    setCreateType(type)
    setFormData({ title: '', description: '' })
    setShowModal(true)
  }, [])

  const closeCreateModal = useCallback(() => {
    setShowModal(false)
  }, [])

  function fetchSummary(): Promise<void> {
    return (async () => {
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const res = await fetch('/.netlify/functions/get-summary')
        if (!res.ok) throw new Error('Failed to fetch summary')
        const data: Summary = await res.json()
        setSummary(data)
        const availableTabs: TabKey[] = data.isAdmin
          ? adminTabs.map(t => t.key)
          : baseTabs.map(t => t.key)
        if (!availableTabs.includes(activeTab)) {
          setActiveTab(availableTabs[0])
        }
      } catch (err: any) {
        setSummaryError(err.message || 'Unknown error')
      } finally {
        setSummaryLoading(false)
      }
    })()
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchItems(type: ItemsType): Promise<void> {
    itemsControllerRef.current?.abort()
    const controller = new AbortController()
    itemsControllerRef.current = controller
    setItemsLoading(true)
    setItemsError(null)
    try {
      const endpoint =
        type === 'maps'
          ? '/.netlify/functions/get-maps'
          : '/.netlify/functions/get-todos'
      const res = await fetch(endpoint, { signal: controller.signal })
      if (!res.ok) throw new Error('Failed to fetch ' + type)
      const data: Item[] = await res.json()
      setItems(data)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setItemsError(err.message || 'Unknown error')
      }
    } finally {
      if (!controller.signal.aborted) {
        setItemsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (activeTab === 'maps' || activeTab === 'todos') {
      fetchItems(activeTab)
    } else {
      setItems([])
    }
    return () => {
      itemsControllerRef.current?.abort()
    }
  }, [activeTab])

  useEffect(() => {
    if (!showModal) return
    const previousActiveElement = document.activeElement as HTMLElement
    const modalEl = modalRef.current
    const focusableSelectors =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    let focusableEls: HTMLElement[] = []
    let firstEl: HTMLElement | undefined
    let lastEl: HTMLElement | undefined
    if (modalEl) {
      focusableEls = Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelectors))
      firstEl = focusableEls[0]
      lastEl = focusableEls[focusableEls.length - 1]
      firstEl?.focus()
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (focusableEls.length === 0) {
          e.preventDefault()
          return
        }
        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault()
            lastEl?.focus()
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault()
            firstEl?.focus()
          }
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeCreateModal()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [showModal, closeCreateModal])

  function handleTabChange(tab: TabKey): void {
    setActiveTab(tab)
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ): void {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleFormSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    try {
      const endpoint =
        createType === 'map'
          ? '/.netlify/functions/create-map'
          : '/.netlify/functions/create-todo'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to create ' + createType)
      closeCreateModal()
      await fetchSummary()
      if (activeTab === (createType === 'map' ? 'maps' : 'todos')) {
        fetchItems(activeTab)
      }
    } catch (err: any) {
      alert(err.message || 'Error')
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      const endpoint =
        activeTab === 'maps'
          ? `/.netlify/functions/delete-map?id=${encodeURIComponent(id)}`
          : `/.netlify/functions/delete-todo?id=${encodeURIComponent(id)}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      fetchItems(activeTab)
      fetchSummary()
    } catch (err: any) {
      alert(err.message || 'Error deleting item')
    }
  }

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      {summaryLoading ? (
        <p>Loading summary...</p>
      ) : summaryError ? (
        <p className="error">{summaryError}</p>
      ) : summary ? (
        <div className="summary-cards">
          <div className="summary-card">
            <h2>Mindmaps</h2>
            <p>{summary.totalMaps}</p>
          </div>
          <div className="summary-card">
            <h2>Todos</h2>
            <p>{summary.totalTodos}</p>
          </div>
          {summary.isAdmin && summary.totalUsers !== undefined && (
            <div className="summary-card">
              <h2>Users</h2>
              <p>{summary.totalUsers}</p>
            </div>
          )}
          {summary.isAdmin && summary.totalPayments !== undefined && (
            <div className="summary-card">
              <h2>Payments</h2>
              <p>{summary.totalPayments}</p>
            </div>
          )}
          {summary.isAdmin && summary.usageStats && (
            <div className="summary-card">
              <h2>Active Users</h2>
              <p>{summary.usageStats.activeUsers}</p>
              <h2>Storage Used</h2>
              <p>{summary.usageStats.storageUsed} MB</p>
            </div>
          )}
        </div>
      ) : null}
      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab-button ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => handleTabChange(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="actions">
        {(activeTab === 'maps' || activeTab === 'todos') && (
          <button
            className="create-button"
            onClick={() => openCreateModal(activeTab === 'maps' ? 'map' : 'todo')}
          >
            Create New {activeTab === 'maps' ? 'Map' : 'Todo'}
          </button>
        )}
      </div>
      <div className="tab-content">
        {itemsLoading ? (
          <p>Loading {activeTab}...</p>
        ) : itemsError ? (
          <p className="error">{itemsError}</p>
        ) : activeTab === 'maps' || activeTab === 'todos' ? (
          items.length > 0 ? (
            <ul className="item-list">
              {items.map(item => (
                <li key={item.id} className="item">
                  <div className="flex justify-between items-center">
                    <div>
                      <strong>
                        <Link
                          to={
                            activeTab === 'maps'
                              ? `/maps/${item.id}`
                              : `/todos/${item.id}`
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {item.title}
                        </Link>
                      </strong>
                      {item.description && <p>{item.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No {activeTab} found.</p>
          )
        ) : (
          <p>Select a tab to view content.</p>
        )}
      </div>
      {showModal && (
        <div className="modal-overlay" onClick={closeCreateModal} aria-hidden="true">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-heading"
            ref={modalRef}
            onClick={e => e.stopPropagation()}
          >
            <h2 id="modal-heading">
              Create New {createType === 'map' ? 'Map' : 'Todo'}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}