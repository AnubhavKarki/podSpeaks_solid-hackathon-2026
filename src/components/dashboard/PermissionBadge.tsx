import { useState } from 'react'
import { Clock, UserCheck, X } from 'lucide-react'
import type { Permission } from '@/types/pod.types'

interface PermissionBadgeProps {
  permission: Permission
  onRevoke?: () => void
}

function isExpiringSoon(expiry: Date | null): boolean {
  if (!expiry) return false
  return expiry.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
}

function isExpired(expiry: Date | null): boolean {
  if (!expiry) return false
  return expiry.getTime() < Date.now()
}

function formatExpiry(expiry: Date | null): string {
  if (!expiry) return 'Permanent'
  if (isExpired(expiry)) return 'Expired'
  const days = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return `${days.toString()}d left`
}

export function PermissionBadge({ permission, onRevoke }: PermissionBadgeProps) {
  const [hovered, setHovered] = useState(false)
  const expired = isExpired(permission.expiry)
  const expiring = isExpiringSoon(permission.expiry)

  const color = expired ? 'var(--revoked)' : expiring ? 'var(--expiring)' : 'var(--granted)'
  const bg = expired
    ? 'rgba(239,68,68,0.12)'
    : expiring
      ? 'rgba(245,158,11,0.12)'
      : 'rgba(20,184,166,0.12)'

  const initial = permission.displayName.charAt(0).toUpperCase()

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: bg,
        border: `1px solid ${color}33`,
        borderRadius: 20,
        fontSize: '0.75rem',
        transition: 'all 120ms ease',
        opacity: hovered && onRevoke ? 0.85 : 1,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.65rem',
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}>
        {initial}
      </div>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {permission.displayName}
      </span>
      {permission.expiry && (
        <span style={{ color, display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Clock size={10} />
          {formatExpiry(permission.expiry)}
        </span>
      )}
      {!permission.expiry && <UserCheck size={10} color={color} />}

      {onRevoke && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRevoke() }}
          title="Revoke access"
          style={{
            position: 'absolute',
            right: -5,
            top: -5,
            width: 16,
            height: 16,
            background: 'var(--accent-danger)',
            border: '2px solid var(--bg-primary)',
            borderRadius: '50%',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            padding: 0,
            flexShrink: 0,
          }}
        >
          <X size={8} />
        </button>
      )}
    </div>
  )
}
