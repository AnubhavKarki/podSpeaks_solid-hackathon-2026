interface OrbProps {
  style?: React.CSSProperties
  color?: string
  size?: number
  delay?: number
}

function Orb({ style, color = '#6366F1', size = 300, delay = 0 }: OrbProps) {
  return (
    <div
      className="animate-breathe"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${size * 0.4}px)`,
        animationDelay: `${delay}s`,
        ...style,
      }}
    />
  )
}

export function GlowingOrb() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Orb
        color="#6366F1"
        size={400}
        style={{ bottom: '-100px', left: '-80px' }}
        delay={0}
      />
      <Orb
        color="#4F46E5"
        size={320}
        style={{ top: '-80px', right: '-60px' }}
        delay={3}
      />
      <Orb
        color="#7C3AED"
        size={260}
        style={{ top: '40%', right: '10%' }}
        delay={5}
      />
    </div>
  )
}
