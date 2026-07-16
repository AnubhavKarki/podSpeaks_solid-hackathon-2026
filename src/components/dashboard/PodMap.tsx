import { useCallback, useRef } from 'react'
import { Plus } from 'lucide-react'
import { FolderCard, FolderCardSkeleton } from './FolderCard'
import type { PodFolder } from '@/types/pod.types'

interface PodMapProps {
  folders: PodFolder[]
  isLoading: boolean
  activeFolderUrl: string | null
  emergencyActive: boolean
  onFolderClick: (folder: PodFolder) => void
  onRevoke?: (folder: PodFolder, webId: string) => void
  onAddDocument?: () => void
}

export function PodMap({ folders, isLoading, activeFolderUrl, emergencyActive, onFolderClick, onRevoke, onAddDocument }: PodMapProps) {
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const setCardRef = useCallback((url: string) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(url, el)
    else cardRefs.current.delete(url)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* Panel header */}
      <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="text-label">Your Data</span>
          {onAddDocument && (
            <button
              onClick={onAddDocument}
              title="Upload a document"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                color: 'var(--text-secondary)',
                fontSize: '0.72rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-active)'; e.currentTarget.style.color = 'var(--accent-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              <Plus size={12} />
              Upload
            </button>
          )}
        </div>
      </div>

      {/* Scrollable folder list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => <FolderCardSkeleton key={i} index={i} />)
        ) : folders.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: 24,
          }}>
            No folders found in your Pod.
          </div>
        ) : (
          folders.map((folder, i) => (
            <FolderCard
              key={folder.url}
              folder={folder}
              index={i}
              isActive={activeFolderUrl === folder.url}
              isGlowing={activeFolderUrl === folder.url && !emergencyActive}
              onClick={() => onFolderClick(folder)}
              cardRef={setCardRef(folder.url)}
              {...(onRevoke ? { onRevoke: (webId: string) => onRevoke(folder, webId) } : {})}
            />
          ))
        )}
      </div>
    </div>
  )
}
