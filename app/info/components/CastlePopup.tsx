'use client'

import type { CastleWithDetails } from '@/lib/supabase'

type Props = {
  castle: CastleWithDetails
  screenX: number
  screenY: number
  onClose: () => void
}

function fmt(n: number) {
  return n.toLocaleString('ko-KR')
}

export default function CastlePopup({ castle, screenX, screenY, onClose }: Props) {
  const { troops, alliance } = castle
  const factionLabel = alliance?.faction?.color_label ?? null
  const factionId = alliance?.faction_id ?? null

  // Keep popup inside viewport
  const popupW = 220
  const popupH = 170
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const left = Math.min(Math.max(screenX - popupW / 2, 8), vw - popupW - 8)
  const top = screenY - popupH - 16 < 8 ? screenY + 16 : screenY - popupH - 16

  return (
    <>
      {/* backdrop (mobile tap-to-close) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 49 }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed',
          left,
          top: Math.max(top, 8),
          width: popupW,
          zIndex: 50,
          background: 'var(--bg-2)',
          border: '1px solid var(--sep)',
          borderRadius: 14,
          padding: '14px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{castle.name}</span>
            <span
              style={{
                marginLeft: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 6,
                background: 'var(--fill-3)',
                color: 'var(--label-2)',
              }}
            >
              Lv.{castle.level}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--label-3)',
              fontSize: 18,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Alliance & faction */}
        {alliance ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: castle.color_hex,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--label-2)' }}>
              {alliance.name}
              {factionId && (
                <span style={{ color: 'var(--label-3)', marginLeft: 4 }}>
                  · {factionId} {factionLabel && `(${factionLabel})`}
                </span>
              )}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--label-3)', marginBottom: 10 }}>미점령</div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--sep)', marginBottom: 10 }} />

        {/* Troops */}
        {troops ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
            {[
              { label: '수비병력', value: fmt(troops.garrison) },
              { label: '부대수', value: fmt(troops.unit_count) },
              { label: '성방어군', value: fmt(troops.defense_army) },
              { label: '방어수치', value: troops.defense_rating },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: 'var(--label-3)', marginBottom: 1 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--label-3)' }}>부대 정보 없음</div>
        )}
      </div>
    </>
  )
}
