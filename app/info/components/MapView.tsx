'use client'

import { useEffect, useState } from 'react'
import type { MapData } from '@/lib/supabase'
import MapCanvas from './MapCanvas'

const UNOCCUPIED_COLOR = '#6B7280'

export default function MapView() {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/map/data')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--red)' }}>데이터 로드 실패: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--label-3)' }}>지도 데이터 불러오는 중…</p>
      </div>
    )
  }

  const legendItems = [
    ...data.factions.map((f) => ({ color: f.color_hex, label: `${f.id} (${f.color_label})` })),
    { color: UNOCCUPIED_COLOR, label: '미점령' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Map */}
      <MapCanvas castles={data.castles} />

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 16px',
          padding: '12px 16px',
          background: 'var(--bg-2)',
          borderTop: '1px solid var(--sep)',
          flexShrink: 0,
        }}
      >
        {legendItems.map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--label-2)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
