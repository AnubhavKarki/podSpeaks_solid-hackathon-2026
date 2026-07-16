import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { getDefaultSession, EVENTS } from '@inrupt/solid-client-authn-browser'
import type { Session } from '@inrupt/solid-client-authn-browser'
import { SessionContext } from '@/contexts/SessionContext'
import { SOLID_OIDC_ISSUER, APP_NAME } from '@/config/solid'
import type { SessionContextValue } from '@/types/session'

export function SessionProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<Session | null>(null)
  sessionRef.current ??= getDefaultSession()
  const session = sessionRef.current

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [webId, setWebId] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncSessionState = () => {
      setIsLoggedIn(session.info.isLoggedIn)
      setWebId(session.info.webId)
    }

    const onSessionRestore = () => {
      syncSessionState()
      setIsLoading(false)
    }

    session.events.on(EVENTS.SESSION_RESTORED, onSessionRestore)

    void session
      .handleIncomingRedirect({ url: window.location.href, restorePreviousSession: true })
      .then(() => {
        syncSessionState()
        setIsLoading(false)
      })
      .catch(() => {
        setIsLoading(false)
      })

    return () => {
      session.events.off(EVENTS.SESSION_RESTORED, onSessionRestore)
    }
  }, [session])

  const login = useCallback(
    async (oidcIssuer = SOLID_OIDC_ISSUER) => {
      await session.login({
        oidcIssuer,
        redirectUrl: `${window.location.origin}${window.location.pathname}`,
        clientName: APP_NAME,
      })
    },
    [session],
  )

  const logout = useCallback(async () => {
    await session.logout({ logoutType: 'app' })
    setIsLoggedIn(false)
    setWebId(undefined)
  }, [session])

  const value: SessionContextValue = { session, isLoggedIn, webId, isLoading, login, logout }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
