const ToastContext = createContext<ToastContextValue | undefined>(undefined)
const MAX_TOASTS = 5
const AUTO_HIDE_DURATION = 5000

const ToastNotifications: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => {
      timeouts.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeouts.current.clear()
    }
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timeoutId = timeouts.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeouts.current.delete(id)
    }
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substr(2, 9)
    setToasts(prev => {
      const next = [...prev]
      if (next.length >= MAX_TOASTS) {
        const oldest = next.shift()!
        const oldestTimeout = timeouts.current.get(oldest.id)
        if (oldestTimeout) {
          clearTimeout(oldestTimeout)
          timeouts.current.delete(oldest.id)
        }
      }
      next.push({ id, message, type })
      return next
    })
    const timeoutId = setTimeout(() => {
      hideToast(id)
    }, AUTO_HIDE_DURATION)
    timeouts.current.set(id, timeoutId)
  }, [hideToast])

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {isMounted &&
        createPortal(
          <div role="status" aria-live="polite" style={containerStyle}>
            {toasts.map(toast => (
              <div key={toast.id} style={{ ...toastBaseStyle, ...toastTypeStyles[toast.type] }}>
                <span style={messageStyle}>{toast.message}</span>
                <button onClick={() => hideToast(toast.id)} style={closeButtonStyle} aria-label="Close">
                  &times;
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastNotifications provider')
  }
  return context
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  top: '1rem',
  right: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  zIndex: 9999,
}

const toastBaseStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  borderRadius: '4px',
  minWidth: '250px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  color: '#fff',
  fontSize: '0.9rem',
}

const toastTypeStyles: Record<ToastType, CSSProperties> = {
  success: { backgroundColor: '#48BB78' },
  error: { backgroundColor: '#F56565' },
  info: { backgroundColor: '#4299E1' },
  warning: { backgroundColor: '#ED8936' },
}

const messageStyle: CSSProperties = {
  flex: 1,
  marginRight: '0.5rem',
}

const closeButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'inherit',
  fontSize: '1.2rem',
  cursor: 'pointer',
  lineHeight: '1',
}

export default ToastNotifications
export { useToast }