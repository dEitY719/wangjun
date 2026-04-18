'use client'

import { useState } from 'react'

type Kingdom = '위' | '촉' | '오'

const TABS: Kingdom[] = ['위', '촉', '오']

const TAB_COLOR: Record<Kingdom, { accent: string; dim: string }> = {
  위: { accent: '#7eb3e0', dim: '#1e3a5f' },
  촉: { accent: '#4caf7d', dim: '#0f3320' },
  오: { accent: '#e07e7e', dim: '#5f1e1e' },
}

/* ───── 촉 데이터 ───── */
type Alliance = {
  rank: number
  name: string
  leader: string
  command: string
  diplomat?: string
}

const CHUK: Alliance[] = [
  { rank: 1, name: '한나라',   leader: '손권',  command: '적토마', diplomat: '칭다오' },
  { rank: 2, name: '대한제국', leader: 'DIOR',  command: '제1군' },
  { rank: 3, name: '호표기',   leader: '비키',  command: '꽌우' },
]

/* ───── 오 데이터 ───── */
const O_ALLIANCES = ['은하수', '(준비중)', '(준비중)']

function AllianceCard({ a, accentColor, dimColor }: { a: Alliance; accentColor: string; dimColor: string }) {
  return (
    <div className="card p-4" style={{ borderColor: accentColor + '55' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: dimColor, color: accentColor, border: `1px solid ${accentColor}` }}>
          {a.rank}맹
        </span>
        <span className="font-bold text-base">{a.name}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>
          <span className="text-xs mr-1" style={{ color: accentColor }}>맹주</span>
          <span className="text-white font-medium">{a.leader}</span>
        </span>
        <span>
          <span className="text-xs mr-1" style={{ color: accentColor }}>지휘부</span>
          <span className="text-white font-medium">{a.command}</span>
        </span>
        {a.diplomat && (
          <span>
            <span className="text-xs mr-1" style={{ color: accentColor }}>외교</span>
            <span className="text-white font-medium">{a.diplomat}</span>
          </span>
        )}
      </div>
    </div>
  )
}

export default function AlliancePage() {
  const [tab, setTab] = useState<Kingdom>('촉')
  const { accent, dim } = TAB_COLOR[tab]

  return (
    <div>
      <h1 className="text-lg font-bold mb-4" style={{ color: 'var(--accent)' }}>⚔️ 연합 현황</h1>

      {/* 탭 */}
      <div className="flex gap-2 mb-5">
        {TABS.map((t) => {
          const active = tab === t
          const c = TAB_COLOR[t]
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-lg font-bold text-sm transition-all"
              style={{
                background: active ? c.dim : 'var(--surface)',
                color: active ? c.accent : 'var(--text-muted)',
                border: `1px solid ${active ? c.accent : 'var(--border)'}`,
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* 위 */}
      {tab === '위' && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <div className="text-4xl mb-3">🏴</div>
          <p>현재 등록된 연합 정보가 없습니다.</p>
        </div>
      )}

      {/* 촉 */}
      {tab === '촉' && (
        <div className="space-y-3">
          {CHUK.map((a) => (
            <AllianceCard key={a.rank} a={a} accentColor={accent} dimColor={dim} />
          ))}
        </div>
      )}

      {/* 오 */}
      {tab === '오' && (
        <div className="space-y-3">
          {O_ALLIANCES.map((name, i) => (
            <div key={i} className="card p-4" style={{ borderColor: accent + '55' }}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: dim, color: accent, border: `1px solid ${accent}` }}>
                  {i + 1}맹
                </span>
                <span className={`font-bold text-base ${name.startsWith('(') ? '' : ''}`}
                  style={{ color: name.startsWith('(') ? 'var(--text-muted)' : 'white' }}>
                  {name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
