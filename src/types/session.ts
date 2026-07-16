import type { Session } from '@inrupt/solid-client-authn-browser'

export interface SessionContextValue {
  session: Session
  isLoggedIn: boolean
  webId: string | undefined
  isLoading: boolean
  login: (oidcIssuer?: string) => Promise<void>
  logout: () => Promise<void>
}
