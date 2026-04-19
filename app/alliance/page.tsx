'use client'

import { useState } from 'react'

type Kingdom = '위' | '촉' | '오'

const TABS: Kingdom[] = ['위', '촉', '오']

const KC: Record<Kingdom, { accent: string; bg: string }> = {
  위: { accent: '#0a84ff', bg: 'rgba(10,132,255,0.12)' },
  촉: { accent: '#30d158', bg: 'rgba(48,209,88,0.12)'  },
  오: { accent: '#ff9f0a', bg: 'rgba(255,159,10,0.12)' },
}

type Alliance = {
  rank: number
  name: string
  leader: string
  command: string
  diplomat?: string
}

type OAlliance = {
  rank: number
  name: string
  leader: string
  viceLeaders?: string[]
}

const CHUK: Alliance[] = [
  { rank: 1, name: '한나라',   leader: '손권',   command: '적토마', diplomat: '칭다오' },
  { rank: 2, name: '대한제국', leader: 'DIOR',   command: '제1군' },
  { rank: 3, name: '호표기',   leader: '비키거라', command: '꽌우' },
  { rank: 4, name: '곽회사단', leader: '간호사',  command: '김관장' },
]

const O_DATA: OAlliance[] = [
  { rank: 1, name: '은하수', leader: '뽀꽁', viceLeaders: ['교라니', '공명', '뱅쇼', '정형돈'] },
  { rank: 2, name: '향',    leader: '' },
  { rank: 3, name: 'kor',   leader: '' },
  { rank: 4, name: '환',    leader: '' },
]

function InfoRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12, color: accent, fontWeight: 600, minWidth: 36 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

export default function AlliancePage() {
  const [tab, setTab] = useState<Kingdom>('촉')
  const { accent, bg } = KC[tab]

  return (
    <div>
      {/* 연합 배너 */}
      <div style={{ paddingTop: 52, marginBottom: 16, textAlign: 'center' }}>
        <img src="/alliance.png" alt="연합" style={{ maxWidth: '100%', display: 'inline-block' }} />
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

      {/* 위 */}
      {tab === '위' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏴</div>
          <p style={{ fontSize: 17, color: 'var(--label-2)', marginBottom: 4 }}>등록된 연합 정보가 없습니다</p>
          <p style={{ fontSize: 15, color: 'var(--label-3)' }}>조만간 업데이트될 예정입니다</p>
        </div>
      )}

      {/* 촉 */}
      {tab === '촉' && (
        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CHUK.map((a) => (
            <div key={a.rank} style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                  background: bg, color: accent,
                }}>
                  {a.rank}맹
                </span>
                <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>{a.name}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px 20px' }}>
                <InfoRow label="맹주" value={a.leader} accent={accent} />
                <InfoRow label="지휘부" value={a.command} accent={accent} />
                {a.diplomat && <InfoRow label="외교" value={a.diplomat} accent={accent} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 오 */}
      {tab === '오' && (
        <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {O_DATA.map((a) => (
            <div key={a.rank} style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.leader ? 10 : 0 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                  background: bg, color: accent,
                }}>
                  {a.rank}맹
                </span>
                <span style={{
                  fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
                  color: a.name ? 'var(--label)' : 'var(--label-3)',
                }}>
                  {a.name || '(준비중)'}
                </span>
              </div>
              {a.leader && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px 20px' }}>
                  <InfoRow label="맹주" value={a.leader} accent={accent} />
                  {a.viceLeaders && a.viceLeaders.length > 0 && (
                    <InfoRow label="부맹주" value={a.viceLeaders.join(', ')} accent={accent} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
