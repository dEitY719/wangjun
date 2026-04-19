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
      {/* Large Title */}
      <div style={{ padding: '52px 20px 20px' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>정보</h1>
      </div>

      {/* Segmented Control */}
      <div style={{ padding: '0 16px 20px' }}>
        <div className="seg-control">
          {TABS.map((t) => (
            <button key={t} className={`seg-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* 지도 */}
      {tab === '지도' && (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
          <p style={{ fontSize: 17, color: 'var(--label-2)', marginBottom: 4 }}>준비 중입니다</p>
          <p style={{ fontSize: 15, color: 'var(--label-3)' }}>지도 기능이 곧 추가될 예정입니다</p>
        </div>
      )}

      {/* 관청Lv */}
      {tab === '관청Lv' && (
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 13, color: 'var(--label-3)', marginBottom: 12, padding: '0 4px' }}>
            관청 N레벨 달성 조건 — 아래 건물들이 모두{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>N-1레벨</span> 이상이어야 합니다
          </p>

          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg-2)' }}>
            {OFFICE_LEVELS.map(({ level, requirements }, i) => (
              <div key={level} style={{ padding: '14px 16px', position: 'relative' }}>
                {i > 0 && (
                  <div style={{ position: 'absolute', top: 0, left: 16, right: 0, height: 1, background: 'var(--sep)' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* Level badge */}
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 52 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--orange)', letterSpacing: -0.5 }}>{level}</div>
                    <div style={{ fontSize: 11, color: 'var(--label-3)', marginTop: 1 }}>관청</div>
                  </div>

                  {/* Separator */}
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--sep-opaque)' }} />

                  {/* Requirements */}
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {requirements.map((req) => {
                      const isPrimary = req === '군의당'
                      return (
                        <span key={req} style={{
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: 8,
                          background: isPrimary ? 'var(--fill-3)' : 'rgba(255,159,10,0.14)',
                          color: isPrimary ? 'var(--label-2)' : 'var(--orange)',
                          letterSpacing: -0.1,
                        }}>
                          {req} {level - 1}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
