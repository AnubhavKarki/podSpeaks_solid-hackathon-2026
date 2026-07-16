import { useState, useCallback } from 'react'
import {
  Upload, X, CheckCircle, FolderLock, Heart, DollarSign, Scale,
  FileText, Users, Briefcase, Camera, User, type LucideIcon,
} from 'lucide-react'
import { ensureContainer, uploadFileToPod } from '@/services/solidService'
import type { PodFolder } from '@/types/pod.types'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  health: Heart, financial: DollarSign, legal: Scale, documents: FileText,
  family: Users, work: Briefcase, photos: Camera, profile: User,
}
const CATEGORY_COLORS: Record<string, string> = {
  health: '#EF4444', financial: '#10B981', legal: '#8B5CF6', documents: '#3B82F6',
  family: '#F59E0B', work: '#6366F1', photos: '#EC4899', profile: '#14B8A6',
}
const CATEGORY_LABELS: Record<string, string> = {
  health: 'Medical Records', financial: 'Banking & Tax', legal: 'Legal Documents',
  documents: 'Personal Docs', family: 'Family', work: 'Work Files',
  photos: 'Photos', profile: 'Profile',
}
const KNOWN_CATEGORIES = Object.keys(CATEGORY_ICONS)

function classifyFile(name: string, fileType: string): string {
  const n = name.toLowerCase()
  if (/medical|doctor|prescription|lab|health|hospital|clinic|diagnosis|vaccine|rx|blood|ecg|mri|xray|radiology/.test(n)) return 'health'
  if (/bank|tax|invoice|receipt|payment|income|expense|finance|statement|insurance|super|abn|tfn|budget/.test(n)) return 'financial'
  if (/contract|agreement|lease|deed|legal|court|lawyer|will|testament|nda|affidavit|terms/.test(n)) return 'legal'
  if (/family|birth|marriage|wedding|child|genealogy|reunion|relative/.test(n)) return 'family'
  if (/resume|cv|job|work|employment|portfolio|project|meeting|report|proposal|salary|payslip/.test(n)) return 'work'
  if (/\.(jpg|jpeg|png|gif|bmp|heic|webp|svg)$/i.test(n) || /^image\//.test(fileType)) return 'photos'
  if (/profile|bio|avatar|passport|id.?card|license|permit/.test(n)) return 'profile'
  return 'documents'
}

type Phase = 'idle' | 'classified' | 'uploading' | 'done' | 'error'

interface DocumentUploadProps {
  isOpen: boolean
  onClose: () => void
  folders: PodFolder[]
  podUrl: string
  fetchFn: typeof fetch
  onComplete: () => void
}

export function DocumentUpload({ isOpen, onClose, folders, podUrl, fetchFn, onComplete }: DocumentUploadProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const existingNames = folders.map((f) => f.name)
  const allCategories = [...new Set([...KNOWN_CATEGORIES, ...existingNames])]

  const handleFile = useCallback((f: File) => {
    setFile(f)
    setCategory(classifyFile(f.name, f.type))
    setPhase('classified')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!file || !category) return
    setPhase('uploading')
    try {
      const containerUrl = `${podUrl}${category}/`
      await ensureContainer(containerUrl, fetchFn)
      await uploadFileToPod(containerUrl, file, fetchFn)
      setPhase('done')
      onComplete()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed')
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle')
    setFile(null)
    setCategory('')
    setErrorMsg('')
  }

  const handleClose = () => { reset(); onClose() }

  if (!isOpen) return null

  const Icon = CATEGORY_ICONS[category] ?? FolderLock
  const color = CATEGORY_COLORS[category] ?? 'var(--accent-primary)'
  const label = CATEGORY_LABELS[category] ?? (category.charAt(0).toUpperCase() + category.slice(1))
  const isNew = category !== '' && !existingNames.includes(category)

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 14,
          padding: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Add Document</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 3 }}>
              Automatically classified and stored in your Pod
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* Done */}
        {phase === 'done' && file && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <CheckCircle size={40} color="var(--accent-teal)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>Uploaded successfully</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
              <strong>{file.name}</strong> is now in your <strong>{label}</strong> folder.
            </div>
            {isNew && (
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-teal)', marginBottom: 16 }}>
                New category <strong>{label}</strong> was created in your Pod.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button
                onClick={reset}
                style={{ padding: '8px 18px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Add another
              </button>
              <button
                onClick={handleClose}
                style={{ padding: '8px 18px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
            <div style={{ color: 'var(--accent-danger)', fontWeight: 600, marginBottom: 8 }}>Upload failed</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>{errorMsg}</div>
            <button onClick={() => setPhase('classified')} style={{ padding: '8px 20px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {/* Idle: drop zone */}
        {phase === 'idle' && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: '36px 24px',
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
              borderRadius: 10,
              background: dragOver ? 'rgba(99,102,241,0.04)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Upload size={28} color={dragOver ? 'var(--accent-primary)' : 'var(--text-tertiary)'} strokeWidth={1.5} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '0.88rem', marginBottom: 3 }}>Drop a file here</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>or click to browse — any file type</div>
            </div>
            <input type="file" onChange={handleFileInput} style={{ display: 'none' }} />
          </label>
        )}

        {/* Classified / uploading */}
        {(phase === 'classified' || phase === 'uploading') && file && (
          <>
            {/* File info row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
              padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}>
              <FileText size={15} color="var(--text-secondary)" strokeWidth={1.5} />
              <span style={{ fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {file.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                {file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
              </span>
            </div>

            {/* Classified-as section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Classified as
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color={color} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
                  {isNew
                    ? <div style={{ fontSize: '0.72rem', color: 'var(--accent-teal)' }}>New folder will be created in your Pod</div>
                    : <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Existing folder</div>}
                </div>
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={phase === 'uploading'}
                style={{
                  width: '100%', padding: '8px 10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 7, fontSize: '0.82rem',
                  color: 'var(--text-primary)',
                  cursor: phase === 'uploading' ? 'default' : 'pointer',
                }}
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
                ))}
              </select>
            </div>

            {/* Destination path */}
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: 18, fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              → {podUrl}{category}/{file.name.replace(/\s+/g, '_')}
            </div>

            {/* Actions */}
            {phase === 'classified' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => void handleUpload()}
                  style={{
                    flex: 1, padding: '10px', background: 'var(--accent-teal)', color: '#fff',
                    borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Upload size={14} />
                  Upload to Pod
                </button>
                <button
                  onClick={reset}
                  style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {phase === 'uploading' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-teal)', fontSize: '0.85rem' }}>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(13,148,136,0.3)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                Uploading to your Pod…
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
