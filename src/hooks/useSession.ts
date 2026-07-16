import { useContext } from 'react'
import { SessionContext } from '@/contexts/SessionContext'
import type { SessionContextValue } from '@/types/session'

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (ctx === null) throw new Error('useSession must be used within a <SessionProvider>')
  return ctx
}
