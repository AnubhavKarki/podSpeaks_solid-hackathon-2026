import { useState } from 'react'
import { History, ChevronDown, ChevronUp, Lock } from 'lucide-react'
import type { AuditEntry } from '@/types/audit.types'

interface AuditLogProps {
  entries: AuditEntry[]
  isLoading: boolean
}

const ACTION_COLOR: Record<string, string> = {
  grant: 'var(--granted)',
  revoke: 'var(--revoked)',
  query: '#60A5FA',
  emergency: 'var(--expiring)',
}

const ACTION_LABEL: Record<string, string> = {
  grant: 'Granted',
  revoke: 'Revoked',
  query: 'Queried',
  emergency: 'Emergency',
}

function formatTime(date: Date): string {
  return date.toLocaleString('en-AU', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function AuditEntryRow({ entry, isLatest }: { entry: AuditEntry; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const color = ACTION_COLOR[entry.action] ?? 'var(--text-tertiary)'
  const label = ACTION_LABEL[entry.action] ?? entry.action

  return (
    <div
      className="animate-slide-in-right"
      onClick={() => setExpanded((v) => !v)}
      style={{
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Dot — pulses if it's the freshest entry */}
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 5 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: color, boxShadow: `0 0 6px ${color}`,
          }} />
          {isLatest && (
            <div style={{
              position: 'absolute', inset: -3,
              borderRadius: '50%',
              border: `1px solid ${color}`,
              animation: 'indigoPulse 1.4s ease-in-out infinite',
              opacity: 0.6,
            }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Action badge + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color, flexShrink: 0,
            }}>
              {label}
            </span>
            <span className="text-mono" style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>
              {formatTime(entry.timestamp)}
            </span>
          </div>

          {/* Original instruction */}
          <p style={{ fontSize: '0.83rem', lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 3, fontStyle: 'italic' }}>
            "{entry.instruction}"
          </p>

          {/* Result summary */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {entry.confirmationMessage.length > 80
              ? entry.confirmationMessage.slice(0, 80) + '…'
              : entry.confirmationMessage}
          </p>

          {/* Expanded raw JSON */}
          {expanded && (
            <pre className="animate-fade-in-up" style={{
              marginTop: 8,
              padding: '8px 10px',
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)',
              border: '1px solid var(--border-subtle)',
            }}>
              {JSON.stringify({ action: entry.action, target: entry.target, webId: entry.webId }, null, 2)}
            </pre>
          )}
        </div>

        {/* Expand chevron */}
        <div style={{ flexShrink: 0, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </div>
    </div>
  )
}

export function AuditLog({ entries, isLoading }: AuditLogProps) {
  const [filter, setFilter] = useState('')

  const filtered = entries.filter(
    (e) =>
      filter === '' ||
      e.instruction.toLowerCase().includes(filter.toLowerCase()) ||
      e.action.includes(filter.toLowerCase()),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={13} color="var(--text-secondary)" />
            <span className="text-label">Consent &amp; Audit Log</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '2px 7px', borderRadius: 10,
              background: 'rgba(13,148,136,0.08)',
              border: '1px solid rgba(13,148,136,0.25)',
              fontSize: '0.65rem', fontWeight: 600,
              color: 'var(--accent-teal)',
            }}>
              <Lock size={9} />
              Encrypted
            </div>
            {entries.length > 0 && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 600,
                padding: '2px 7px', borderRadius: 10,
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}>
                {entries.length}
              </span>
            )}
          </div>
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter…"
          style={{
            width: '100%', padding: '7px 10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 7, fontSize: '0.8rem',
          }}
        />
      </div>

      {/* Entry list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {isLoading && entries.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', padding: '16px 0' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '32px 16px', textAlign: 'center', gap: 8,
          }}>
            <History size={28} color="var(--border-active)" strokeWidth={1} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              Every access decision you make is recorded here as an encrypted consent entry.<br />
              Try asking "Who can see my data?"
            </p>
          </div>
        ) : (
          filtered.map((entry, i) => (
            <AuditEntryRow key={entry.id} entry={entry} isLatest={i === 0} />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          AES-256 encrypted and stored in your Solid Pod. Only you can read this.
        </p>
      </div>
    </div>
  )
}
