import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error'
}

interface ToastContextValue {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++counter.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-in-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: toast.type === 'success' ? 'rgba(20,184,166,0.15)' : 'rgba(239,68,68,0.15)',
              border: `1px solid ${toast.type === 'success' ? 'rgba(20,184,166,0.4)' : 'rgba(239,68,68,0.4)'}`,
              borderRadius: 10,
              backdropFilter: 'blur(12px)',
              fontSize: '0.85rem',
              color: toast.type === 'success' ? 'var(--accent-teal)' : 'var(--accent-danger)',
              maxWidth: 300,
              pointerEvents: 'auto',
              animation: 'slideInRight 220ms cubic-bezier(0.16,1,0.3,1) both',
            }}
          >
            {toast.type === 'success'
              ? <CheckCircle size={14} strokeWidth={2} />
              : <AlertCircle size={14} strokeWidth={2} />}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
