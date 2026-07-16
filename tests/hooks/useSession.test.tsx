import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useSession } from '@/hooks/useSession'
import { SessionProvider } from '@/providers/SessionProvider'

vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: () => ({
    info: { isLoggedIn: false, webId: undefined, sessionId: 'test' },
    events: { on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() },
    handleIncomingRedirect: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    logout: vi.fn(),
    fetch: vi.fn(),
  }),
  EVENTS: {
    LOGIN: 'login',
    LOGOUT: 'logout',
    SESSION_RESTORED: 'sessionRestore',
    ERROR: 'error',
    SESSION_EXPIRED: 'sessionExpired',
    SESSION_EXTENDED: 'sessionExtended',
    TIMEOUT_SET: 'timeoutSet',
    NEW_REFRESH_TOKEN: 'newRefreshToken',
    NEW_TOKENS: 'newTokens',
    AUTHORIZATION_REQUEST: 'authorizationRequest',
  },
}))

describe('useSession', () => {
  it('throws when used outside SessionProvider', () => {
    function Bare() {
      useSession()
      return null
    }
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => render(<Bare />)).toThrow('useSession must be used within a <SessionProvider>')
    consoleError.mockRestore()
  })

  it('returns session context values inside SessionProvider', async () => {
    function Reader() {
      const { isLoggedIn, isLoading, login, logout } = useSession()
      return (
        <div>
          <span data-testid="logged-in">{String(isLoggedIn)}</span>
          <span data-testid="loading">{String(isLoading)}</span>
          <span data-testid="has-login">{String(typeof login === 'function')}</span>
          <span data-testid="has-logout">{String(typeof logout === 'function')}</span>
        </div>
      )
    }

    render(
      <SessionProvider>
        <Reader />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('logged-in').textContent).toBe('false')
    expect(screen.getByTestId('has-login').textContent).toBe('true')
    expect(screen.getByTestId('has-logout').textContent).toBe('true')
  })
})
