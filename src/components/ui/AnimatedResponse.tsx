import { useState, useEffect, useRef } from 'react'

interface AnimatedResponseProps {
  text: string
  onComplete?: () => void
  speed?: number
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8em', background: 'var(--bg-tertiary)', padding: '1px 5px', borderRadius: 4 }}>{part.slice(1, -1)}</code>
    return <span key={i}>{part}</span>
  })
}

export function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    nodes.push(
      <ul key={key} style={{ paddingLeft: 16, margin: '6px 0', listStyle: 'disc' }}>
        {listItems.map((item, i) => (
          <li key={i} style={{ marginBottom: 3 }}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    listItems = []
  }

  lines.forEach((line, i) => {
    const t = line.trim()
    if (t.startsWith('### ')) { flushList(`l${i}`); nodes.push(<p key={i} style={{ fontWeight: 700, fontSize: '0.88rem', margin: '10px 0 4px' }}>{renderInline(t.slice(4))}</p>) }
    else if (t.startsWith('## ')) { flushList(`l${i}`); nodes.push(<p key={i} style={{ fontWeight: 700, fontSize: '0.92rem', margin: '10px 0 4px' }}>{renderInline(t.slice(3))}</p>) }
    else if (t.startsWith('- ') || t.startsWith('* ')) { listItems.push(t.slice(2)) }
    else if (t === '') { flushList(`l${i}`); nodes.push(<div key={i} style={{ height: 5 }} />) }
    else { flushList(`l${i}`); nodes.push(<p key={i} style={{ margin: '3px 0', lineHeight: 1.6 }}>{renderInline(t)}</p>) }
  })
  flushList('end')
  return nodes
}

export function AnimatedResponse({ text, onComplete, speed = 12 }: AnimatedResponseProps) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  // Stable ref so the effect never restarts due to onComplete changing
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete })

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    if (!text) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
        onCompleteRef.current?.()
      }
    }, speed)
    return () => clearInterval(interval)
  }, [text, speed]) // onComplete intentionally excluded — use ref above

  if (done) {
    return <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{renderMarkdown(text)}</div>
  }

  return (
    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
      {displayed}
      <span className="animate-blink" style={{ color: 'var(--accent-primary)' }}>▌</span>
    </span>
  )
}
