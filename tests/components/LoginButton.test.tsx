import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LoginButton } from '@/components/LoginButton'
import { SessionProvider } from '@/providers/SessionProvider'

const mocks = vi.hoisted(() => {
  const info = { isLoggedIn: false, webId: undefined as string | undefined, sessionId: 'test' }
  const login = vi.fn().mockResolvedValue(undefined)
  return { info, login }
})

vi.mock('@inrupt/solid-client-authn-browser', () => ({
  getDefaultSession: () => ({
    info: mocks.info,
    events: { on: vi.fn().mockReturnThis(), off: vi.fn().mockReturnThis() },
    handleIncomingRedirect: vi.fn().mockResolvedValue(undefined),
    login: mocks.login,
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

describe('LoginButton', () => {
  it('renders with default label', async () => {
    render(
      <SessionProvider>
        <LoginButton />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    expect(screen.getByRole('button', { name: 'Log in with Solid' })).toBeTruthy()
  })

  it('renders with custom label', async () => {
    render(
      <SessionProvider>
        <LoginButton label="Sign in" />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeTruthy()
  })

  it('is disabled while loading', () => {
    vi.mocked(mocks.login)
    render(
      <SessionProvider>
        <LoginButton />
      </SessionProvider>,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('calls login with the correct oidcIssuer on click', async () => {
    render(
      <SessionProvider>
        <LoginButton oidcIssuer="https://pods.d01.solidcommunity.au" />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled())
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith(
      expect.objectContaining({ oidcIssuer: 'https://pods.d01.solidcommunity.au' }),
    ))
  })
})
