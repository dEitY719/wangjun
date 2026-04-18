'use client'

import { useState } from 'react'

type InfoTab = '지도' | '관청Lv'

const TABS: InfoTab[] = ['지도', '관청Lv']

const OFFICE_LEVELS = [
  { level: 26, requirements: ['군의당', '창병영', '농지'] },
  { level: 27, requirements: ['군의당', '궁병영', '벌목장'] },
  { level: 28, requirements: ['군의당', '방패병영', '채석장', '수학소'] },
  { level: 29, requirements: ['군의당', '의원', '각루'] },
  { level: 30, requirements: ['군의당', '기병영', '창고'] },
]

export default function InfoPage() {
  const [tab, setTab] = useState<InfoTab>('관청Lv')

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

      {/* 지도 */}
      {tab === '지도' && (
        <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-sm">준비 중입니다.</p>
        </div>
      )}

      {/* 관청Lv */}
      {tab === '관청Lv' && (
        <div>
          <p className="text-xs mb-4 px-1" style={{ color: 'var(--text-muted)' }}>
            관청 N레벨 달성 조건 — 해당 건물들이 모두 <span style={{ color: 'var(--accent)' }}>N-1레벨</span> 이상이어야 합니다.
          </p>
          <div className="space-y-2">
            {OFFICE_LEVELS.map(({ level, requirements }) => (
              <div key={level} className="card p-4 flex items-center gap-4">
                {/* 관청 레벨 */}
                <div className="shrink-0 text-center w-16">
                  <div className="text-lg font-bold" style={{ color: 'var(--accent)' }}>{level}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>관청</div>
                </div>

                {/* 구분선 */}
                <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

                {/* 필요 건물 (모두 level-1) */}
                <div className="flex flex-wrap gap-2">
                  {requirements.map((req) => (
                    <span
                      key={req}
                      className="text-xs px-2 py-1 rounded-md font-medium"
                      style={{
                        background: req === '군의당' ? 'var(--surface2)' : 'var(--accent-dim)',
                        color: req === '군의당' ? 'var(--text-muted)' : 'var(--accent)',
                        border: `1px solid ${req === '군의당' ? 'var(--border)' : 'var(--accent)'}`,
                      }}
                    >
                      {req} {level - 1}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
