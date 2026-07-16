import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LogoutButton } from '@/components/LogoutButton'
import { SessionProvider } from '@/providers/SessionProvider'

const mocks = vi.hoisted(() => {
  const logout = vi.fn().mockResolvedValue(undefined)
  return { logout }
})

vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: () => ({
    info: { isLoggedIn: false, webId: undefined, sessionId: 'test' },
    events: { on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() },
    handleIncomingRedirect: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
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

describe('LogoutButton', () => {
  it('renders with default label', async () => {
    render(
      <SessionProvider>
        <LogoutButton />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy())
  })

  it('renders with custom label', async () => {
    render(
      <SessionProvider>
        <LogoutButton label="Sign out" />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy())
  })

  it('calls logout when clicked', async () => {
    render(
      <SessionProvider>
        <LogoutButton />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button')).toBeTruthy())
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(mocks.logout).toHaveBeenCalledWith({ logoutType: 'app' }))
  })
})
