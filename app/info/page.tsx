'use client'

import { useState } from 'react'

type InfoTab = '지도' | '관청Lv'

const TABS: InfoTab[] = ['지도', '관청Lv']

export default function InfoPage() {
  const [tab, setTab] = useState<InfoTab>('지도')

  return (
    <div>
      <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>📖 게임 정보</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => {
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: active ? 'var(--accent-dim)' : 'var(--surface)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* TODO 플레이스홀더 */}
      <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
        <div className="text-4xl mb-3">{tab === '지도' ? '🗺️' : '🏛️'}</div>
        <p className="font-medium mb-1">{tab} 정보</p>
        <p className="text-sm">준비 중입니다.</p>
      </div>
    </div>
  )
}
