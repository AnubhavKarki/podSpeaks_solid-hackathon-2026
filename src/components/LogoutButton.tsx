import { useSession } from '@/hooks/useSession'

interface LogoutButtonProps {
  label?: string
}

export function LogoutButton({ label = 'Log out' }: LogoutButtonProps) {
  const { logout } = useSession()
  return (
    <button onClick={() => void logout()} type="button">
      {label}
    </button>
  )
}
