import { useEffect } from 'react'
import { SessionProvider } from '@/providers/SessionProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { useSession } from '@/hooks/useSession'
import { LoginScreen } from '@/components/auth/LoginScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'

function AppContent() {
  const { isLoggedIn, isLoading } = useSession()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--border-active)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Restoring session…</p>
      </div>
    )
  }

  return isLoggedIn ? <Dashboard /> : <LoginScreen />
}

export function App() {
  useEffect(() => {
    document.title = 'PodSpeaks — Your Pod, your language'
  }, [])

  return (
    <SessionProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </SessionProvider>
  )
}
