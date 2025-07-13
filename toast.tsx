const TOAST_DURATION = 3000
const EVENT_SHOW_TOAST = 'show-toast'
const EVENT_REMOVE_TOAST = 'remove-toast'
const toastTimers: Record<string, number> = {}

export type ToastType = 'success' | 'error' | 'info'

export function showToast(message: string, type: ToastType): void {
  const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  const detail = { id, message, type }
  window.dispatchEvent(new CustomEvent(EVENT_SHOW_TOAST, { detail }))
  const timerId = window.setTimeout(() => removeToast(id), TOAST_DURATION)
  toastTimers[id] = timerId
}

export function removeToast(id: string): void {
  const timerId = toastTimers[id]
  if (timerId) {
    clearTimeout(timerId)
    delete toastTimers[id]
  }
  window.dispatchEvent(new CustomEvent(EVENT_REMOVE_TOAST, { detail: { id } }))
}

export function ToastContainer(): JSX.Element {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([])

  useEffect(() => {
    const addToast = (e: Event) => {
      const { id, message, type } = (e as CustomEvent<{ id: string; message: string; type: ToastType }>).detail
      setToasts(prev => [...prev, { id, message, type }])
    }
    const deleteToast = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail
      setToasts(prev => prev.filter(t => t.id !== id))
    }
    window.addEventListener(EVENT_SHOW_TOAST, addToast)
    window.addEventListener(EVENT_REMOVE_TOAST, deleteToast)
    return () => {
      window.removeEventListener(EVENT_SHOW_TOAST, addToast)
      window.removeEventListener(EVENT_REMOVE_TOAST, deleteToast)
    }
  }, [])

  const containerStyle: CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none',
  }

  const toastStyleBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 15px',
    borderRadius: '4px',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    pointerEvents: 'auto',
    minWidth: '200px',
    maxWidth: '350px',
  }

  const typeStyles: Record<ToastType, CSSProperties> = {
    success: { backgroundColor: '#38a169' },
    error: { backgroundColor: '#e53e3e' },
    info: { backgroundColor: '#3182ce' },
  }

  const closeButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    fontSize: '16px',
    cursor: 'pointer',
    marginLeft: '10px',
  }

  return (
    <div aria-live="assertive" aria-atomic="true" style={containerStyle}>
      {toasts.map(toast => (
        <div key={toast.id} role="alert" style={{ ...toastStyleBase, ...typeStyles[toast.type] }}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} style={closeButtonStyle} aria-label="Close">&times;</button>
        </div>
      ))}
    </div>
  )
}