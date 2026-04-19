'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { CastleWithDetails } from '@/lib/supabase'
import CastlePopup from './CastlePopup'

const MAP_SIZE = 2000
const GRID_STEP = 200
const MIN_ZOOM = 0.18
const MAX_ZOOM = 6
const TERRITORY = 30   // 성 영역 한 변 크기 (게임 좌표 단위)
const HALF = TERRITORY / 2

type Props = {
  castles: CastleWithDetails[]
}

type PopupState = {
  castle: CastleWithDetails
  screenX: number
  screenY: number
}

export default function MapCanvas({ castles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.22)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [popup, setPopup] = useState<PopupState | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // ── Pan (mouse) ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
  }, [])

  const stopDrag = useCallback(() => { dragging.current = false; setIsDragging(false) }, [])

  // ── Zoom (wheel) ──
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
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
    const dx = t.clientX - lastTouch.current.x
    const dy = t.clientY - lastTouch.current.y
    lastTouch.current = { x: t.clientX, y: t.clientY }
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }))
  }, [])

  const handleMarkerClick = useCallback(
    (castle: CastleWithDetails, e: React.MouseEvent) => {
      e.stopPropagation()
      setPopup({ castle, screenX: e.clientX, screenY: e.clientY })
    },
    [],
  )

  const gridLines = []
  for (let v = 0; v <= MAP_SIZE; v += GRID_STEP) {
    gridLines.push(
      <line key={`h${v}`} x1={0} y1={v} x2={MAP_SIZE} y2={v} stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />,
      <line key={`v${v}`} x1={v} y1={0} x2={v} y2={MAP_SIZE} stroke="rgba(255,255,255,0.07)" strokeWidth={0.5} />,
    )
    // coordinate labels every 400 units
    if (v > 0 && v % 400 === 0) {
      gridLines.push(
        <text key={`lx${v}`} x={v} y={14} fontSize={10} fill="rgba(255,255,255,0.2)" textAnchor="middle">{v}</text>,
        <text key={`ly${v}`} x={6} y={v + 4} fontSize={10} fill="rgba(255,255,255,0.2)" textAnchor="start">{v}</text>,
      )
    }
  }

  const showLabels = zoom >= 1.2

  return (
    <div style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
      {/* Map container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onClick={() => setPopup(null)}
      >
        <svg
          width={MAP_SIZE}
          height={MAP_SIZE}
          viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
          style={{
            display: 'block',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            background: '#0a0f1a',
          }}
        >
          {/* Grid */}
          <g>{gridLines}</g>

          {/* Border */}
          <rect x={0} y={0} width={MAP_SIZE} height={MAP_SIZE} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* Castle markers — hovered 성은 맨 마지막에 렌더해서 항상 위에 표시 */}
          <g>
            {[...castles.filter((c) => c.name !== hovered), ...castles.filter((c) => c.name === hovered)].map((c) => {
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
                  {/* 영역 배경 (진영 색상) */}
                  <rect
                    x={rx}
                    y={ry}
                    width={size}
                    height={size}
                    fill={c.color_hex}
                    opacity={isHovered ? 0.95 : 0.75}
                    rx={2}
                  />
                  {/* 테두리 */}
                  <rect
                    x={rx}
                    y={ry}
                    width={size}
                    height={size}
                    fill="none"
                    stroke={isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.45)'}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    rx={2}
                  />
                  {/* 중심 점 */}
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={1.5}
                    fill="rgba(0,0,0,0.5)"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* castle name label */}
                  {showLabels && (
                    <text
                      x={c.x}
                      y={ry - 3}
                      fontSize={9}
                      fill="rgba(255,255,255,0.9)"
                      textAnchor="middle"
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
      </div>

      {/* Zoom controls */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {[{ label: '+', delta: 1.3 }, { label: '−', delta: 0.77 }].map(({ label, delta }) => (
          <button
            key={label}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--bg-3)',
              border: '1px solid var(--sep)',
              color: 'var(--label)',
              fontSize: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => { setZoom(0.22); setOffset({ x: 0, y: 0 }) }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--bg-3)',
            border: '1px solid var(--sep)',
            color: 'var(--label-2)',
            fontSize: 11,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          전체
        </button>
      </div>

      {/* Popup */}
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
