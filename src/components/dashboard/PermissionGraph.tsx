import { useEffect, useRef, useState } from 'react'
import type { PodFolder } from '@/types/pod.types'

interface PermissionGraphProps {
  folders: PodFolder[]
  cardRefs: Map<string, HTMLDivElement>
  containerRef: HTMLDivElement | null
  emergencyActive: boolean
}

interface Line {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  animated: boolean
  dissolving: boolean
}

export function PermissionGraph({ folders, cardRefs, containerRef, emergencyActive }: PermissionGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!containerRef) return
    const obs = new ResizeObserver(() => {
      setDims({ w: containerRef.offsetWidth, h: containerRef.offsetHeight })
    })
    obs.observe(containerRef)
    setDims({ w: containerRef.offsetWidth, h: containerRef.offsetHeight })
    return () => obs.disconnect()
  }, [containerRef])

  useEffect(() => {
    if (!containerRef) return
    const containerRect = containerRef.getBoundingClientRect()
    const newLines: Line[] = []

    for (const folder of folders) {
      const cardEl = cardRefs.get(folder.url)
      if (!cardEl) continue
      const cardRect = cardEl.getBoundingClientRect()

      const cardCenterX = cardRect.left - containerRect.left + cardRect.width / 2
      const cardCenterY = cardRect.top - containerRect.top + cardRect.height / 2

      folder.currentAccess.forEach((permission, i) => {
        const spread = (i - (folder.currentAccess.length - 1) / 2) * 20
        const targetX = cardCenterX + spread
        const targetY = cardRect.top - containerRect.top - 10

        newLines.push({
          id: `${folder.url}-${permission.webId}`,
          x1: cardCenterX,
          y1: cardCenterY,
          x2: targetX,
          y2: targetY,
          color: permission.expiry && permission.expiry.getTime() - Date.now() < 7 * 86400000
            ? 'var(--expiring)'
            : 'var(--granted)',
          animated: permission.expiry !== null,
          dissolving: false,
        })
      })
    }

    setLines(newLines)
  }, [folders, cardRefs, containerRef, dims])

  if (lines.length === 0) return null

  return (
    <svg
      ref={svgRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}
      width={dims.w}
      height={dims.h}
    >
      <defs>
        <filter id="glow-teal">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {lines.map((line) => (
        <line
          key={line.id}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={emergencyActive ? 'var(--revoked)' : line.color}
          strokeWidth={1}
          strokeOpacity={emergencyActive ? 0.2 : 0.25}
          strokeDasharray={line.animated ? '4 4' : undefined}
          filter={line.animated ? 'url(#glow-amber)' : 'url(#glow-teal)'}
          style={
            line.animated
              ? { animation: 'dashOffset 1s linear infinite' }
              : emergencyActive
                ? { animation: 'dissolve 800ms ease-out forwards' }
                : undefined
          }
        />
      ))}
    </svg>
  )
}
