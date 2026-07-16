import { useEffect, useMemo, useRef, useState } from 'react'
import { Shield, Wifi, WifiOff, Copy, LogOut, Users, AlertTriangle, X } from 'lucide-react'
import { useSession } from '@/hooks/useSession'
import { usePodStructure } from '@/hooks/usePodStructure'
import { useClaudeIntent } from '@/hooks/useClaudeIntent'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuditLog } from '@/hooks/useAuditLog'
import { useToast } from '@/components/ui/Toast'
import { PodMap } from './PodMap'
import { CommandBar } from './CommandBar'
import { AuditLog } from './AuditLog'
import { DocumentUpload } from './DocumentUpload'
import { DEMO_FOLDERS, DEMO_AUDIT_ENTRIES } from '@/constants/demoData'
import type { PodFolder } from '@/types/pod.types'
import type { ParsedOperation } from '@/types/claude.types'

interface ExpiryWarning {
  key: string
  folder: PodFolder
  displayName: string
  permWebId: string
  days: number
}

function calcPrivacyScore(folders: PodFolder[]): number {
  if (folders.length === 0) return 100
  let exposure = 0
  for (const f of folders) {
    for (const a of f.currentAccess) {
      exposure += 1
      if (a.modes.includes('write')) exposure += 0.5
      if (!a.expiry) exposure += 0.5
    }
  }
  const maxExposure = folders.length * 6
  return Math.max(0, Math.round(100 - (exposure / maxExposure) * 100))
}

function getExpiryWarnings(folders: PodFolder[]): ExpiryWarning[] {
  const warnings: ExpiryWarning[] = []
  for (const folder of folders) {
    for (const perm of folder.currentAccess) {
      if (perm.expiry && perm.expiry.getTime() > Date.now()) {
        const days = Math.ceil((perm.expiry.getTime() - Date.now()) / 86400000)
        if (days <= 7) {
          warnings.push({
            key: `${folder.url}::${perm.webId}`,
            folder,
            displayName: perm.displayName,
            permWebId: perm.webId,
            days,
          })
        }
      }
    }
  }
  return warnings.sort((a, b) => a.days - b.days)
}

function getPodName(webId: string): string {
  try {
    const url = new URL(webId)
    const parts = url.pathname.replace(/\/profile\/card(#me)?$/, '').split('/').filter(Boolean)
    return parts[parts.length - 1] ?? url.hostname
  } catch {
    return webId.slice(0, 20)
  }
}

export function Dashboard() {
  const { session, webId: ownerWebId, logout } = useSession()
  const podUrl = ownerWebId?.replace('/profile/card#me', '/') ?? ''
  const podName = ownerWebId ? getPodName(ownerWebId) : ''

  const { podStructure, isLoading: podLoading, refresh } = usePodStructure(
    podUrl,
    ownerWebId ?? '',
    session.fetch,
  )

  const claudeIntent = useClaudeIntent()
  const { executeOperation } = usePermissions()
  const auditLog = useAuditLog()

  const [activeFolderUrl, setActiveFolderUrl] = useState<string | null>(null)
  const [emergencyActive, setEmergencyActive] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set())
  const [showUpload, setShowUpload] = useState(false)
  const podMapRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()

  const copyWebId = () => {
    if (!ownerWebId) return
    void navigator.clipboard.writeText(ownerWebId).then(() => showToast('WebID copied to clipboard'))
  }

  const handleLogout = () => void logout()

  const totalPeople = useMemo(() => {
    const ids = new Set(
      (podStructure?.folders ?? []).flatMap((f: PodFolder) => f.currentAccess.map((a) => a.webId))
    )
    return ids.size
  }, [podStructure])

  useEffect(() => {
    void refresh()
    auditLog.seedEntries(DEMO_AUDIT_ENTRIES)
    void auditLog.load(podUrl, session.fetch, ownerWebId ?? undefined)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podUrl])

  // Auto-execute query operations — read-only, no confirmation needed
  useEffect(() => {
    if (claudeIntent.state === 'ready' && claudeIntent.operation?.operation === 'query' && podStructure) {
      void handleExecute(null)
    }
  // handleExecute is recreated each render; we want the one from THIS render (fresh claudeIntent)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claudeIntent.state, claudeIntent.operation?.operation])

  const handleExecute = async (webIdOverride: string | null) => {
    const { operation, lastInstruction } = claudeIntent
    if (!operation || !podStructure) return

    if (operation.operation !== 'query') claudeIntent.setExecuting()
    if (operation.target) setActiveFolderUrl(operation.target)
    if (operation.operation === 'emergency') setEmergencyActive(true)

    try {
      await executeOperation(operation, webIdOverride, podStructure.folders, session.fetch)

      await auditLog.addEntry(
        lastInstruction,
        operation.operation === 'emergency' ? 'emergency' : operation.operation === 'query' ? 'query' : operation.operation,
        operation.confirmationMessage,
        operation.target,
        operation.targetName,
        webIdOverride ?? operation.webId,
        podUrl,
        session.fetch,
        ownerWebId ?? undefined,
      )

      if (operation.operation !== 'query') {
        setCelebrating(true)
        setTimeout(() => setCelebrating(false), 1200)
      }

      claudeIntent.setComplete()
      await refresh()
    } catch {
      claudeIntent.setComplete()
    } finally {
      setActiveFolderUrl(null)
      setEmergencyActive(false)
    }
  }

  const handleQuickRevoke = async (folder: PodFolder, targetWebId: string) => {
    const perm = folder.currentAccess.find((a) => a.webId === targetWebId)
    if (!perm) return
    const op: ParsedOperation = {
      operation: 'revoke',
      target: folder.url,
      targetName: folder.name,
      webId: targetWebId,
      webIdNeeded: false,
      modes: [],
      expiry: null,
      confirmationMessage: `Revoked ${perm.displayName}'s access to ${folder.name}`,
      clarificationNeeded: null,
    }
    try {
      await executeOperation(op, null, folders, session.fetch)
      await auditLog.addEntry(
        `Revoke ${perm.displayName}'s access to ${folder.name}`,
        'revoke',
        op.confirmationMessage,
        folder.url,
        folder.name,
        targetWebId,
        podUrl,
        session.fetch,
        ownerWebId ?? undefined,
      )
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 1200)
      showToast(`${perm.displayName}'s access revoked`)
      await refresh()
    } catch {
      showToast('Could not revoke — demo data only works via command')
    }
  }

  // Merge real Pod folders with demo folders (real ones take priority by name)
  const realFolders: PodFolder[] = podStructure?.folders ?? []
  const realNames = new Set(realFolders.map((f) => f.name))
  const folders: PodFolder[] = [
    ...realFolders,
    ...DEMO_FOLDERS.filter((d) => !realNames.has(d.name)),
  ]

  const privacyScore = calcPrivacyScore(folders)
  const expiryWarnings = getExpiryWarnings(folders)
  const visibleWarning = expiryWarnings.find((w) => !dismissedWarnings.has(w.key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <DocumentUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        folders={folders}
        podUrl={podUrl}
        fetchFn={session.fetch}
        onComplete={() => { void refresh() }}
      />
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(12px)',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color="var(--accent-primary)" strokeWidth={1.5} />
          <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: '0.95rem' }}>PodSpeaks</span>
        </div>

        {/* Right: status + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

          {/* Privacy Score */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: privacyScore >= 70 ? 'rgba(13,148,136,0.08)' : privacyScore >= 40 ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)',
            border: `1px solid ${privacyScore >= 70 ? 'rgba(13,148,136,0.3)' : privacyScore >= 40 ? 'rgba(217,119,6,0.3)' : 'rgba(220,38,38,0.3)'}`,
            borderRadius: 20,
            fontSize: '0.73rem',
            color: privacyScore >= 70 ? 'var(--accent-teal)' : privacyScore >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
            fontWeight: 600,
            transition: 'all 400ms ease',
          }}>
            <Shield size={11} strokeWidth={2} />
            {privacyScore}% private
          </div>

          {/* Access count */}
          {totalPeople > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 20,
              fontSize: '0.73rem',
              color: 'var(--accent-primary)',
              fontWeight: 500,
            }}>
              <Users size={11} />
              {totalPeople} {totalPeople === 1 ? 'person' : 'people'} with access
            </div>
          )}

          {/* Connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {session.info.isLoggedIn
              ? <><Wifi size={13} color="var(--accent-teal)" /><span style={{ fontSize: '0.73rem', color: 'var(--accent-teal)' }}>Connected</span></>
              : <><WifiOff size={13} color="var(--accent-danger)" /><span style={{ fontSize: '0.73rem', color: 'var(--accent-danger)' }}>Offline</span></>}
          </div>

          {/* WebID copy button */}
          {ownerWebId && (
            <button
              onClick={copyWebId}
              title={`${ownerWebId} — click to copy`}
              className="dashboard-header-webid"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.73rem',
                color: 'var(--text-secondary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--accent-glow)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              {getPodName(ownerWebId)}
              <Copy size={10} strokeWidth={1.5} style={{ opacity: 0.5 }} />
            </button>
          )}

          {/* Avatar */}
          {podName && (
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.8rem', color: '#fff',
              flexShrink: 0,
            }}>
              {podName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Disconnect Pod"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 7,
              color: 'var(--text-tertiary)',
              fontSize: '0.73rem',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = 'var(--accent-danger)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
          >
            <LogOut size={12} strokeWidth={1.5} />
            Disconnect
          </button>
        </div>
      </header>

      {/* Expiry alert banner */}
      {visibleWarning && (
        <div className="animate-fade-in-up" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 20px',
          background: 'rgba(217,119,6,0.08)',
          borderBottom: '1px solid rgba(217,119,6,0.22)',
          fontSize: '0.78rem',
          flexShrink: 0,
        }}>
          <AlertTriangle size={13} color="var(--accent-warning)" />
          <span style={{ flex: 1, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-warning)' }}>{visibleWarning.displayName}</strong>'s access to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{visibleWarning.folder.name}</strong>{' '}
            expires in <strong style={{ color: 'var(--accent-warning)' }}>{visibleWarning.days}d</strong> — act now or it lapses automatically.
          </span>
          <button
            onClick={() => void handleQuickRevoke(visibleWarning.folder, visibleWarning.permWebId)}
            style={{
              padding: '3px 10px',
              background: 'rgba(217,119,6,0.15)',
              border: '1px solid rgba(217,119,6,0.4)',
              borderRadius: 6,
              color: 'var(--accent-warning)',
              fontSize: '0.73rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Revoke now
          </button>
          <button
            onClick={() => setDismissedWarnings((prev) => new Set([...prev, visibleWarning.key]))}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2 }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Three-panel body */}
      <div ref={podMapRef} className="dashboard-body" style={{ display: 'flex', flex: 1, overflow: 'hidden', gap: 0 }}>
        {/* Left: Pod Map */}
        <div
          className="dashboard-left"
          style={{
            width: '30%', minWidth: 240,
            borderRight: '1px solid var(--border-subtle)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}
        >
          {celebrating && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
              background: 'rgba(20,184,166,0.12)',
              animation: 'grantFlash 1.2s ease-out forwards',
            }} />
          )}
          <PodMap
            folders={folders}
            isLoading={podLoading}
            activeFolderUrl={activeFolderUrl}
            emergencyActive={emergencyActive}
            onFolderClick={(folder) => setActiveFolderUrl(folder.url)}
            onRevoke={handleQuickRevoke}
            onAddDocument={() => setShowUpload(true)}
          />
        </div>

        {/* Centre: Command Bar */}
        <div className="dashboard-center" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CommandBar
            claudeIntent={claudeIntent}
            podStructure={podStructure}
            onExecute={handleExecute}
            folders={folders}
          />
        </div>

        {/* Right: Consent & Audit Log */}
        <div className="dashboard-right" style={{ width: '30%', minWidth: 240, borderLeft: '1px solid var(--border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AuditLog entries={auditLog.entries} isLoading={auditLog.isLoading} />
        </div>
      </div>
    </div>
  )
}
