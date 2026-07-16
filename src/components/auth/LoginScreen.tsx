import { useState } from 'react'
import { Shield } from 'lucide-react'
import { ParticleField } from '@/components/ui/ParticleField'
import { GlowingOrb } from '@/components/ui/GlowingOrb'
import { useSession } from '@/hooks/useSession'

const DEFAULT_ISSUER = import.meta.env.VITE_SOLID_IDP ?? 'https://pods.d01.solidcommunity.au'

export function LoginScreen() {
  const { login, isLoading } = useSession()
  const [customIssuer, setCustomIssuer] = useState('')

  const handleConnect = () => void login(DEFAULT_ISSUER)
  const handleCustomConnect = () => {
    const issuer = customIssuer.trim() || DEFAULT_ISSUER
    void login(issuer)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <ParticleField />
      <GlowingOrb />

      <div
        className="animate-fade-in-up"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 380, padding: '0 24px', textAlign: 'center' }}
      >
        {/* Wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <Shield size={28} color="var(--accent-primary)" strokeWidth={1.5} />
          <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            PodSpeaks
          </span>
        </div>

        <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '1rem', lineHeight: 1.5 }}>
          Your Pod.&nbsp; Your rules.&nbsp; Your language.
        </p>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: 32, fontSize: '0.82rem', lineHeight: 1.6 }}>
          Manage who can see your personal data using plain English — no technical knowledge required. All consent decisions are encrypted and stored only in your Solid Pod.
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleConnect}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: isLoading ? 'rgba(99,102,241,0.5)' : 'var(--accent-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.95rem',
            borderRadius: 10,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 120ms ease',
            marginBottom: 20,
            letterSpacing: '-0.01em',
          }}
        >
          {isLoading ? 'Connecting…' : 'Connect your Solid Pod'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>or enter your Pod URL</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        </div>

        {/* Custom issuer */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          <input
            type="url"
            value={customIssuer}
            onChange={(e) => setCustomIssuer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomConnect()}
            placeholder={DEFAULT_ISSUER}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}
          />
          <button
            onClick={handleCustomConnect}
            disabled={isLoading}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid var(--border-active)',
              borderRadius: 8,
              color: 'var(--accent-glow)',
              fontWeight: 500,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            }}
          >
            Connect
          </button>
        </div>

        {/* Quote */}
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          "The interface Solid always needed."
        </p>
      </div>
    </div>
  )
}
