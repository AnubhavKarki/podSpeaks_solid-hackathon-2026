import { FolderLock, Heart, DollarSign, Scale, FileText, Users, Briefcase, Camera, User, type LucideIcon } from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  health: Heart,
  financial: DollarSign,
  legal: Scale,
  documents: FileText,
  family: Users,
  work: Briefcase,
  photos: Camera,
  profile: User,
}

const CATEGORY_LABELS: Record<string, string> = {
  health: 'Medical Records',
  financial: 'Banking & Tax',
  legal: 'Legal Documents',
  documents: 'Personal Docs',
  family: 'Family',
  work: 'Work Files',
  photos: 'Photos',
  profile: 'Profile',
}

const CATEGORY_COLORS: Record<string, string> = {
  health: '#EF4444',
  financial: '#10B981',
  legal: '#8B5CF6',
  documents: '#3B82F6',
  family: '#F59E0B',
  work: '#6366F1',
  photos: '#EC4899',
  profile: '#14B8A6',
}
import { PermissionBadge } from './PermissionBadge'
import type { PodFolder } from '@/types/pod.types'

interface FolderCardProps {
  folder: PodFolder
  index: number
  isActive: boolean
  isGlowing: boolean
  onClick: () => void
  cardRef?: (el: HTMLDivElement | null) => void
  onRevoke?: (webId: string) => void
}

export function FolderCard({ folder, index, isActive, isGlowing, onClick, cardRef, onRevoke }: FolderCardProps) {
  const hasAccess = folder.currentAccess.length > 0
  const Icon = CATEGORY_ICONS[folder.name] ?? FolderLock
  const label = CATEGORY_LABELS[folder.name] ?? folder.name
  const accentColor = CATEGORY_COLORS[folder.name] ?? 'var(--accent-primary)'

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="animate-fade-in-up"
      style={{
        padding: '14px 16px',
        background: isActive ? 'rgba(99,102,241,0.08)' : 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${isGlowing ? 'rgba(20,184,166,0.6)' : isActive ? 'var(--border-active)' : 'var(--border-subtle)'}`,
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 180ms ease',
        animationDelay: `${index * 60}ms`,
        boxShadow: isGlowing ? '0 0 16px rgba(20,184,166,0.25)' : isActive ? '0 0 12px rgba(99,102,241,0.2)' : 'none',
        animation: isGlowing
          ? 'pulse 1s ease-in-out infinite, fadeInUp 350ms cubic-bezier(0.16,1,0.3,1) both'
          : undefined,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={accentColor} strokeWidth={1.5} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {label}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            /{folder.name}/
          </div>
        </div>
        <div style={{
          marginLeft: 'auto',
          padding: '2px 8px',
          borderRadius: 10,
          fontSize: '0.7rem',
          fontWeight: 600,
          background: hasAccess ? 'rgba(20,184,166,0.15)' : 'rgba(71,85,105,0.3)',
          color: hasAccess ? 'var(--accent-teal)' : 'var(--text-tertiary)',
          flexShrink: 0,
        }}>
          {folder.currentAccess.length} {folder.currentAccess.length === 1 ? 'person' : 'people'}
        </div>
      </div>

      {/* Permission badges */}
      {hasAccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {folder.currentAccess.slice(0, 3).map((p) => (
            <PermissionBadge key={p.webId} permission={p} {...(onRevoke ? { onRevoke: () => onRevoke(p.webId) } : {})} />
          ))}
          {folder.currentAccess.length > 3 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', paddingLeft: 4 }}>
              +{folder.currentAccess.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '3px 10px',
          background: 'rgba(71,85,105,0.2)',
          borderRadius: 20,
          fontSize: '0.72rem',
          color: 'var(--text-tertiary)',
        }}>
          No access granted
        </div>
      )}
    </div>
  )
}

export function FolderCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        padding: '14px 16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="animate-shimmer" style={{ height: 14, width: '60%', borderRadius: 4, marginBottom: 10 }} />
      <div className="animate-shimmer" style={{ height: 24, width: '80%', borderRadius: 14, marginBottom: 6 }} />
      <div className="animate-shimmer" style={{ height: 24, width: '50%', borderRadius: 14 }} />
    </div>
  )
}
