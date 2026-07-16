import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSession } from '@/hooks/useSession'
import { SessionProvider } from '@/providers/SessionProvider'

// ---------------------------------------------------------------------------
// Hoisted mocks — created before vi.mock hoisting runs
// ---------------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  const info = { isLoggedIn: false, webId: undefined as string | undefined, sessionId: 'test' }
  const events = { on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() }
  const handleIncomingRedirect = vi.fn().mockResolvedValue(undefined)
  const login = vi.fn().mockResolvedValue(undefined)
  const logout = vi.fn().mockResolvedValue(undefined)
  return { info, events, handleIncomingRedirect, login, logout }
})

vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: () => ({
    info: mocks.info,
    events: mocks.events,
    handleIncomingRedirect: mocks.handleIncomingRedirect,
    login: mocks.login,
    logout: mocks.logout,
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

// ---------------------------------------------------------------------------
// Helper: consumer component
// ---------------------------------------------------------------------------
function Consumer() {
  const { isLoggedIn, webId, isLoading } = useSession()
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="webid">{webId ?? 'none'}</span>
    </div>
  )
}

beforeEach(() => {
  mocks.info.isLoggedIn = false
  mocks.info.webId = undefined
  mocks.handleIncomingRedirect.mockResolvedValue(undefined)
  vi.clearAllMocks()
  mocks.events.on.mockReturnThis()
  mocks.events.off.mockReturnThis()
})

describe('SessionProvider', () => {
  it('starts in loading state', () => {
    mocks.handleIncomingRedirect.mockReturnValue(new Promise(() => undefined))
    render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    expect(screen.getByTestId('loading').textContent).toBe('true')
  })

  it('resolves loading after handleIncomingRedirect settles', async () => {
    render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
  })

  it('reflects not-logged-in state when session has no user', async () => {
    render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('logged-in').textContent).toBe('false')
    expect(screen.getByTestId('webid').textContent).toBe('none')
  })

  it('reflects logged-in state when session has webId', async () => {
    mocks.info.isLoggedIn = true
    mocks.info.webId = 'https://pods.d01.solidcommunity.au/anubhav/profile/card#me'

    render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('logged-in').textContent).toBe('true')
    expect(screen.getByTestId('webid').textContent).toBe(
      'https://pods.d01.solidcommunity.au/anubhav/profile/card#me',
    )
  })

  it('registers SESSION_RESTORED listener on mount', async () => {
    render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(mocks.events.on).toHaveBeenCalledWith('sessionRestore', expect.any(Function))
  })

  it('removes SESSION_RESTORED listener on unmount', async () => {
    const { unmount } = render(
      <SessionProvider>
        <Consumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    unmount()
    expect(mocks.events.off).toHaveBeenCalledWith('sessionRestore', expect.any(Function))
  })

  it('logout clears session state', async () => {
    mocks.info.isLoggedIn = true
    mocks.info.webId = 'https://pods.d01.solidcommunity.au/anubhav/profile/card#me'

    function LogoutConsumer() {
      const { logout, isLoggedIn } = useSession()
      return (
        <div>
          <span data-testid="logged-in">{String(isLoggedIn)}</span>
          <button onClick={() => void logout()}>logout</button>
        </div>
      )
    }

    render(
      <SessionProvider>
        <LogoutConsumer />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('logged-in').textContent).toBe('true'))

    mocks.info.isLoggedIn = false
    mocks.info.webId = undefined
    mocks.logout.mockResolvedValue(undefined)

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    expect(mocks.logout).toHaveBeenCalled()
    expect(screen.getByTestId('logged-in').textContent).toBe('false')
  })
})
