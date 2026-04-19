'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { CastleWithDetails } from '@/lib/supabase'
import CastlePopup from './CastlePopup'

const MAP_SIZE = 2000
const GRID_STEP = 200
const TERRITORY = 30
const HALF = TERRITORY / 2

type VB = { x: number; y: number; w: number; h: number }
type Props = { castles: CastleWithDetails[] }
type PopupState = { castle: CastleWithDetails; screenX: number; screenY: number }

export default function MapCanvas({ castles }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: MAP_SIZE, h: MAP_SIZE })
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const initDone = useRef(false)

  // 컨테이너 크기에 맞게 초기 viewBox 설정 (비율 맞춤 → 꽉 채우기)
  const fitToContainer = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    if (width > 0 && height > 0) {
      setVb({ x: 0, y: 0, w: MAP_SIZE, h: MAP_SIZE * (height / width) })
    }
  }, [])

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true
    fitToContainer()
  }, [fitToContainer])

  // ── Pan (mouse) ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setVb((v) => ({
      ...v,
      x: v.x - dx * (v.w / rect.width),
      y: v.y - dy * (v.h / rect.height),
    }))
  }, [])

  const stopDrag = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
  }, [])

  // ── Zoom (wheel) — 마우스 위치 기준 ──
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scale = e.deltaY > 0 ? 1.15 : 0.87
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setVb((v) => {
      const svgX = v.x + (mx / rect.width) * v.w
      const svgY = v.y + (my / rect.height) * v.h
      const newW = Math.max(50, Math.min(MAP_SIZE * 4, v.w * scale))
      const newH = Math.max(50, Math.min(MAP_SIZE * 4, v.h * scale))
      return {
        x: svgX - (mx / rect.width) * newW,
        y: svgY - (my / rect.height) * newH,
        w: newW,
        h: newH,
      }
    })
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [onWheel])

  // ── Touch pan ──
  const lastTouch = useRef({ x: 0, y: 0 })
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    lastTouch.current = { x: t.clientX, y: t.clientY }
  }, [])
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = t.clientX - lastTouch.current.x
    const dy = t.clientY - lastTouch.current.y
    lastTouch.current = { x: t.clientX, y: t.clientY }
    setVb((v) => ({
      ...v,
      x: v.x - dx * (v.w / rect.width),
      y: v.y - dy * (v.h / rect.height),
    }))
  }, [])

  const handleMarkerClick = useCallback((castle: CastleWithDetails, e: React.MouseEvent) => {
    e.stopPropagation()
    setPopup({ castle, screenX: e.clientX, screenY: e.clientY })
  }, [])

  const zoomStep = useCallback((scale: number) => {
    setVb((v) => {
      const cx = v.x + v.w / 2
      const cy = v.y + v.h / 2
      const newW = Math.max(50, Math.min(MAP_SIZE * 4, v.w * scale))
      const newH = Math.max(50, Math.min(MAP_SIZE * 4, v.h * scale))
      return { x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH }
    })
  }, [])

  // 라벨: 충분히 줌인됐을 때만 표시
  const zoomLevel = MAP_SIZE / vb.w
  const showLabels = zoomLevel >= 1.8

  const gridLines = []
  for (let i = 0; i <= MAP_SIZE; i += GRID_STEP) {
    gridLines.push(
      <line key={`h${i}`} x1={0} y1={i} x2={MAP_SIZE} y2={i} stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />,
      <line key={`v${i}`} x1={i} y1={0} x2={i} y2={MAP_SIZE} stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />,
    )
    if (i > 0 && i % 400 === 0) {
      gridLines.push(
        <text key={`lx${i}`} x={i} y={14} fontSize={10} fill="rgba(255,255,255,0.2)" textAnchor="middle">{i}</text>,
        <text key={`ly${i}`} x={6} y={i + 4} fontSize={10} fill="rgba(255,255,255,0.2)" textAnchor="start">{i}</text>,
      )
    }
  }

  const sortedCastles = [
    ...castles.filter((c) => c.name !== hovered),
    ...castles.filter((c) => c.name === hovered),
  ]

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="none"
        style={{ display: 'block', background: '#0a0f1a', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={() => setPopup(null)}
      >
        <g>{gridLines}</g>
        <rect x={0} y={0} width={MAP_SIZE} height={MAP_SIZE} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        <g>
          {sortedCastles.map((c) => {
            const isHovered = hovered === c.name
            const expand = isHovered ? 2 : 0
            const rx = c.x - HALF - expand
            const ry = c.y - HALF - expand
            const size = TERRITORY + expand * 2
            return (
              <g
                key={c.name}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHovered(c.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => handleMarkerClick(c, e)}
              >
                <rect x={rx} y={ry} width={size} height={size} fill={c.color_hex} opacity={isHovered ? 0.95 : 0.75} rx={2} />
                <rect
                  x={rx} y={ry} width={size} height={size} fill="none"
                  stroke={isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)'}
                  strokeWidth={isHovered ? 1.5 : 0.8} rx={2}
                />
                <circle cx={c.x} cy={c.y} r={1.5} fill="rgba(0,0,0,0.5)" style={{ pointerEvents: 'none' }} />
                {showLabels && (
                  <text
                    x={c.x} y={ry - 3} fontSize={9} fill="rgba(255,255,255,0.9)" textAnchor="middle"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {c.name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{ label: '+', scale: 0.7 }, { label: '−', scale: 1.3 }].map(({ label, scale }) => (
          <button
            key={label}
            onClick={() => zoomStep(scale)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--bg-3)', border: '1px solid var(--sep)',
              color: 'var(--label)', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={fitToContainer}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--bg-3)', border: '1px solid var(--sep)',
            color: 'var(--label-2)', fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          전체
        </button>
      </div>

      {popup && (
        <CastlePopup
          castle={popup.castle}
          screenX={popup.screenX}
          screenY={popup.screenY}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
