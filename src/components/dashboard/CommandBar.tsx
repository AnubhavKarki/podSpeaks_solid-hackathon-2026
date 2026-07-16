import { useState, useRef, useEffect, useCallback } from 'react'
import { Zap, AlertTriangle, CheckCircle, X, Mic, MicOff } from 'lucide-react'
import { AnimatedResponse, renderMarkdown } from '@/components/ui/AnimatedResponse'
import { EXAMPLE_INSTRUCTIONS } from '@/constants/exampleInstructions'
import type { useClaudeIntent } from '@/hooks/useClaudeIntent'
import type { PodFolder, PodStructure } from '@/types/pod.types'

interface CommandBarProps {
  claudeIntent: ReturnType<typeof useClaudeIntent>
  podStructure: PodStructure | null
  onExecute: (webIdOverride: string | null) => Promise<void>
  folders?: PodFolder[]
}

function generateSmartSuggestions(folders: PodFolder[]): string[] {
  const suggestions: string[] = []

  for (const folder of folders) {
    for (const perm of folder.currentAccess) {
      if (perm.expiry && perm.expiry.getTime() > Date.now()) {
        const days = Math.ceil((perm.expiry.getTime() - Date.now()) / 86400000)
        if (days <= 7) {
          suggestions.push(`Remove ${perm.displayName} from ${folder.name} (expires in ${days}d)`)
        }
      }
    }
  }

  if (!suggestions.some((s) => s.includes('see my data'))) {
    suggestions.push('Who can see my data right now?')
  }
  if (suggestions.length < 3) suggestions.push('Revoke all access immediately')
  if (suggestions.length < 4) suggestions.push('Give temporary access to my documents')

  return suggestions.slice(0, 4)
}

function useRotatingPlaceholder(): string {
  const [text, setText] = useState('')
  const [exIndex, setExIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = EXAMPLE_INSTRUCTIONS[exIndex % EXAMPLE_INSTRUCTIONS.length] ?? ''
    const delay = deleting ? 30 : charIndex === current.length ? 1800 : 55

    const t = setTimeout(() => {
      if (!deleting && charIndex < current.length) {
        setText(current.slice(0, charIndex + 1))
        setCharIndex((c) => c + 1)
      } else if (!deleting && charIndex === current.length) {
        setDeleting(true)
      } else if (deleting && charIndex > 0) {
        setText(current.slice(0, charIndex - 1))
        setCharIndex((c) => c - 1)
      } else {
        setDeleting(false)
        setExIndex((i) => i + 1)
      }
    }, delay)

    return () => clearTimeout(t)
  }, [charIndex, deleting, exIndex])

  return text
}

function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null)

  const toggle = useCallback(() => {
    type SR = new () => InstanceType<typeof window.SpeechRecognition>
    const SRClass = ((window as unknown as Record<string, unknown>)['SpeechRecognition']
      ?? (window as unknown as Record<string, unknown>)['webkitSpeechRecognition']) as SR | undefined
    if (!SRClass) return

    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const recognition = new SRClass()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-AU'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      if (transcript) onTranscript(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening, onTranscript])

  return { isListening, toggle }
}

export function CommandBar({ claudeIntent, podStructure, onExecute, folders = [] }: CommandBarProps) {
  const { state, operation, error, submit, reset } = claudeIntent
  const [instruction, setInstruction] = useState('')
  const [webIdInput, setWebIdInput] = useState('')
  const [responseReady, setResponseReady] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const placeholder = useRotatingPlaceholder()

  const { isListening, toggle: toggleVoice } = useVoiceInput((transcript) => {
    setInstruction(transcript)
    textareaRef.current?.focus()
  })

  const handleSubmit = () => {
    const text = instruction.trim()
    if (!text || !podStructure) return
    reset()
    setWebIdInput('')
    setResponseReady(false)
    setHasSubmitted(true)
    // Use merged folders (includes demo data) so Claude knows about all visible permissions
    void submit({
      instruction: text,
      podStructure: { podUrl: podStructure.podUrl, folders: folders.length > 0 ? folders : podStructure.folders },
    })
  }

  const handleConfirm = () => void onExecute(webIdInput.trim() || null)

  const handleReset = () => {
    reset()
    setInstruction('')
    setWebIdInput('')
    setResponseReady(false)
    textareaRef.current?.focus()
  }

  const isEmergency = operation?.operation === 'emergency'
  const isQuery = operation?.operation === 'query'
  const suggestions = generateSmartSuggestions(folders)


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: 12, overflowY: 'auto' }}>
      <div style={{ flexShrink: 0 }}>
        <span className="text-label">Command</span>
      </div>

      {/* Input area */}
      <div style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${state === 'loading' ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
        borderRadius: 12,
        padding: '16px',
        boxShadow: state === 'loading' ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
        transition: 'all 200ms ease',
        animation: state === 'loading' ? 'indigoPulse 1.4s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            rows={3}
            disabled={state === 'executing'}
            style={{
              width: '100%',
              resize: 'none',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          />
          {!instruction && !hasSubmitted && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              fontSize: '0.95rem', lineHeight: 1.6,
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-sans)',
              pointerEvents: 'none',
              userSelect: 'none',
            }}>
              {placeholder}
              <span className="animate-blink" style={{ color: 'var(--accent-primary)', marginLeft: 1 }}>▌</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {/* Voice input button */}
          <button
            onClick={toggleVoice}
            title={isListening ? 'Stop listening' : 'Speak your instruction'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              background: isListening ? 'rgba(220,38,38,0.12)' : 'var(--bg-secondary)',
              border: `1px solid ${isListening ? 'rgba(220,38,38,0.4)' : 'var(--border-subtle)'}`,
              borderRadius: 8,
              color: isListening ? 'var(--accent-danger)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              animation: isListening ? 'indigoPulse 1.2s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}
          >
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>

          <button
            onClick={handleSubmit}
            disabled={!instruction.trim() || state === 'loading' || state === 'executing'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: 'var(--accent-primary)',
              color: '#fff',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: '0.85rem',
              opacity: (!instruction.trim() || state === 'loading' || state === 'executing') ? 0.5 : 1,
              cursor: (!instruction.trim() || state === 'loading' || state === 'executing') ? 'not-allowed' : 'pointer',
              transition: 'opacity 120ms ease',
            }}
          >
            <Zap size={14} />
            Send
          </button>
        </div>
      </div>

      {/* Example chips */}
      {(state === 'idle' || state === 'error') && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flexShrink: 0 }}>
          {suggestions.map((ex) => {
            const isContextual = ex.includes('expires in') || ex.includes('Remove')
            return (
              <button
                key={ex}
                onClick={() => { setInstruction(ex); textareaRef.current?.focus() }}
                style={{
                  padding: '5px 12px',
                  background: isContextual ? 'rgba(217,119,6,0.06)' : 'transparent',
                  border: `1px solid ${isContextual ? 'rgba(217,119,6,0.35)' : 'var(--border-subtle)'}`,
                  borderRadius: 20,
                  color: isContextual ? 'var(--accent-warning)' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isContextual ? 'rgba(217,119,6,0.7)' : 'var(--border-active)'
                  e.currentTarget.style.color = isContextual ? 'var(--accent-warning)' : 'var(--accent-glow)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isContextual ? 'rgba(217,119,6,0.35)' : 'var(--border-subtle)'
                  e.currentTarget.style.color = isContextual ? 'var(--accent-warning)' : 'var(--text-secondary)'
                }}
              >
                {isContextual ? '⚠ ' : ''}{ex}
              </button>
            )
          })}
        </div>
      )}

      {/* Loading state */}
      {state === 'loading' && (
        <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.85rem', flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--border-active)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Understanding your instruction…
        </div>
      )}

      {/* Executing state */}
      {state === 'executing' && (
        <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-teal)', fontSize: '0.85rem', flexShrink: 0 }}>
          <div style={{ width: 16, height: 16, border: '2px solid rgba(20,184,166,0.3)', borderTopColor: 'var(--accent-teal)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          {isQuery ? 'Reading your Pod…' : 'Updating permissions…'}
        </div>
      )}

      {/* Error state */}
      {state === 'error' && error && (
        <div className="animate-fade-in-up glass-card" style={{ padding: '14px 16px', border: '1px solid rgba(239,68,68,0.3)', flexShrink: 0 }}>
          <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}>
            {error.includes('VITE_CLAUDE_API_KEY') ? 'Claude API key not configured. Add VITE_CLAUDE_API_KEY to your .env file.' : "Couldn't parse that instruction. Try rephrasing."}
          </p>
        </div>
      )}

      {/* Response: clarification needed */}
      {state === 'clarification' && operation && (
        <div className="animate-fade-in-up glass-card" style={{ padding: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Zap size={14} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-glow)' }}>PodSpeaks</span>
          </div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 12 }}>
            <AnimatedResponse text={operation.confirmationMessage} onComplete={() => setResponseReady(true)} />
          </p>
          {operation.clarificationNeeded && responseReady && (
            <div className="animate-fade-in-up">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{operation.clarificationNeeded}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="url"
                  value={webIdInput}
                  onChange={(e) => setWebIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                  placeholder="https://example.solidcommunity.net/profile/card#me"
                  style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-active)', borderRadius: 8, fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
                <button onClick={handleConfirm} style={{ padding: '8px 14px', background: 'var(--accent-primary)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.82rem' }}>
                  Submit
                </button>
              </div>
              <button onClick={handleReset} style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-tertiary)', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Response: ready to execute (not shown for queries — they auto-execute) */}
      {state === 'ready' && operation && !isQuery && (
        <div className="animate-fade-in-up" style={{ flexShrink: 0 }}>
          {isEmergency ? (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={16} color="var(--accent-danger)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-danger)' }}>EMERGENCY REVOKE</span>
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 16 }}>
                <AnimatedResponse text={operation.confirmationMessage} onComplete={() => setResponseReady(true)} />
              </p>
              {responseReady && (
                <div className="animate-fade-in-up" style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleConfirm} style={{ flex: 1, padding: '10px', background: 'var(--accent-danger)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    🔴 Revoke Everything
                  </button>
                  <button onClick={handleReset} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Zap size={14} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-glow)' }}>PodSpeaks</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <AnimatedResponse text={operation.confirmationMessage} onComplete={() => setResponseReady(true)} />
              </div>
              {responseReady && (
                <div className="animate-fade-in-up" style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'var(--accent-teal)', color: '#fff', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <CheckCircle size={14} /> Confirm
                  </button>
                  <button onClick={handleReset} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <X size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Complete state */}
      {state === 'complete' && operation && (
        <div className="animate-fade-in-up glass-card" style={{ padding: '16px', border: '1px solid rgba(20,184,166,0.3)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle size={16} color="var(--accent-teal)" />
            <span style={{ fontWeight: 600, color: 'var(--accent-teal)', fontSize: '0.9rem' }}>
              {isQuery ? 'PodSpeaks' : 'Done'}
            </span>
          </div>
          <div style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 8 }}>
            {renderMarkdown(operation.confirmationMessage)}
          </div>
          {!isQuery && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              Consent recorded &amp; encrypted in your Solid Pod. Only you can read this.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
