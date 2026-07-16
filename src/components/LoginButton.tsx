import { useSession } from '@/hooks/useSession'
import { SOLID_OIDC_ISSUER } from '@/config/solid'

interface LoginButtonProps {
  oidcIssuer?: string
  label?: string
}

export function LoginButton({ oidcIssuer = SOLID_OIDC_ISSUER, label = 'Log in with Solid' }: LoginButtonProps) {
  const { login, isLoading } = useSession()
  return (
    <button disabled={isLoading} onClick={() => void login(oidcIssuer)} type="button">
      {label}
    </button>
  )
}
