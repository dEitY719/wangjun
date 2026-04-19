'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { useMemberAuth } from '@/app/hooks/useMemberAuth'

type CategoryType = 'notice' | 'urgent' | 'general' | 'strategy'
type CoordData = { name: string; x: string; y: string; actions: string[] }

const CATEGORY_LABEL: Record<string, string> = { urgent: '긴급', notice: '공지', strategy: '전략', general: '일반' }
const CATEGORY_AUTO_TITLE: Record<string, string> = { urgent: '🚨 긴급', notice: '📢 공지', strategy: '⚔️ 전략', general: '' }
const TARGET_GROUPS = [
  { label: '촉나라', members: ['한나라', '대한제국', '호표기'] },
  { label: '오나라', members: ['은하수', '향', 'kor', '환'] },
]
const COORD_ACTIONS = ['공성', '진출', '공격', '수비', '요새 건설']

const emptyCoord = (): CoordData => ({ name: '', x: '', y: '', actions: [] })
function nowDate() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

export default function WritePage() {
  const { session, ready, authHeaders } = useMemberAuth()
  const router = useRouter()

  const [category, setCategory]         = useState<CategoryType>('notice')
  const [customTitle, setCustomTitle]   = useState('💬 일반')
  const [isPinned]                      = useState(false)
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set())
  const [perTargetCoords, setPerTargetCoords] = useState(false)
  const [sharedCoord, setSharedCoord]   = useState<CoordData>(emptyCoord())
  const [targetCoords, setTargetCoords] = useState<Record<string, CoordData>>({})
  const [schedDate, setSchedDate]       = useState(nowDate)
  const [schedTime, setSchedTime]       = useState(nowTime)
  const [perTargetTime, setPerTargetTime] = useState(false)
  const [targetTimes, setTargetTimes]   = useState<Record<string, string>>({})
  const [extraContent, setExtraContent] = useState('')
  const [previewMode, setPreviewMode]   = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitMsg, setSubmitMsg]       = useState('')

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ready && !session) router.replace('/')
  }, [ready, session, router])

  if (!ready || !session) return null

  const effectiveTargets = (): string[] => {
    const result: string[] = []
    TARGET_GROUPS.forEach(g => g.members.forEach(m => {
      if (selectedTargets.has(`${g.label}:${m}`)) result.push(m)
    }))
    return result
  }

  const getFinalTitle = () => category === 'general' ? customTitle.trim() : CATEGORY_AUTO_TITLE[category]

  const coordLink = (name: string, x: string, y: string) =>
    (x && y) ? `[${name}](${x},${y})` : `[${name}](죄송, 지도 검색해줘요!)`

  const buildContent = (): string => {
    const blocks: string[] = []
    const targets = effectiveTargets()
    if (perTargetCoords && targets.length > 1) {
      const lines = targets.map(t => {
        const c = targetCoords[t] || emptyCoord()
        const actionStr = c.actions.join(' ')
        const timeStr = perTargetTime ? (targetTimes[t] || schedTime) : ''
        return c.name
          ? `**${t}**: ${coordLink(c.name, c.x, c.y)}${actionStr ? ' ' + actionStr : ''}${timeStr ? ' ⏲ ' + timeStr : ''}`
          : `**${t}**: (지역 미입력)`
      })
      blocks.push(lines.join('  \n'))
    } else {
      if (targets.length > 0) blocks.push(`대상: ${targets.join(', ')} 맹원분들은`)
      if (sharedCoord.name) {
        const actionStr = sharedCoord.actions.join(' ')
        blocks.push(`${coordLink(sharedCoord.name, sharedCoord.x, sharedCoord.y)}${actionStr ? ' ' + actionStr : ''}`)
      }
    }
    const dateStr = schedDate ? `📆 ${schedDate.slice(2).replace(/-/g, '-')}` : ''
    const sharedTimeStr = (!perTargetTime || !perTargetCoords || effectiveTargets().length <= 1) && schedTime ? `⏲ ${schedTime}` : ''
    if (dateStr || sharedTimeStr) blocks.push(`${dateStr}${sharedTimeStr ? ' ' + sharedTimeStr : ''}`.trim())
    if (extraContent.trim()) blocks.push(extraContent.trim())
    return blocks.join('\n\n')
  }

  const isGroupAllSelected = (g: typeof TARGET_GROUPS[0]) => g.members.every(m => selectedTargets.has(`${g.label}:${m}`))
  const toggleGroupAll = (g: typeof TARGET_GROUPS[0]) => {
    const next = new Set(selectedTargets)
    isGroupAllSelected(g) ? g.members.forEach(m => next.delete(`${g.label}:${m}`)) : g.members.forEach(m => next.add(`${g.label}:${m}`))
    setSelectedTargets(next)
  }
  const toggleMember = (g: typeof TARGET_GROUPS[0], m: string) => {
    const key = `${g.label}:${m}`
    const next = new Set(selectedTargets)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelectedTargets(next)
  }
  const toggleSharedAction = (a: string) => setSharedCoord(c => ({ ...c, actions: c.actions.includes(a) ? c.actions.filter(x => x !== a) : [...c.actions, a] }))
  const updateTargetCoord = (t: string, patch: Partial<CoordData>) => setTargetCoords(tc => ({ ...tc, [t]: { ...(tc[t] || emptyCoord()), ...patch } }))
  const toggleTargetAction = (t: string, a: string) => setTargetCoords(tc => {
    const c = tc[t] || emptyCoord()
    return { ...tc, [t]: { ...c, actions: c.actions.includes(a) ? c.actions.filter(x => x !== a) : [...c.actions, a] } }
  })
  const handlePerTargetToggle = (val: boolean) => {
    if (val) {
      const ts = effectiveTargets()
      const init: Record<string, CoordData> = {}
      ts.forEach(t => { init[t] = targetCoords[t] || { ...sharedCoord } })
      setTargetCoords(init)
    }
    setPerTargetCoords(val)
  }

  const targets = effectiveTargets()
  const showPerTargetToggle = targets.length > 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = getFinalTitle()
    if (!finalTitle) { setSubmitMsg('error-title'); return }
    setSubmitting(true); setSubmitMsg('')
    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ title: finalTitle, content: buildContent(), category, is_pinned: isPinned }),
    })
    setSubmitting(false)
    if (res.ok) { setSubmitMsg('success'); setTimeout(() => router.push('/'), 1500) }
    else if (res.status === 401) setSubmitMsg('error-auth')
    else setSubmitMsg('error')
  }

  const inputSt: React.CSSProperties = { flex: 1, minWidth: 44, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-4)', color: 'var(--label)', border: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit' }

  return (
    <div>
      <div style={{ padding: '52px 20px 16px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>공지 작성</h1>
          <p style={{ fontSize: 13, color: 'var(--label-3)', marginTop: 2 }}>{session.displayName || session.id}</p>
        </div>
        <button onClick={() => router.push('/')} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--fill-3)', color: 'var(--label-2)', cursor: 'pointer', fontFamily: 'inherit' }}>홈으로</button>
      </div>

      <div ref={formRef} style={{ margin: '0 16px 32px' }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '18px 16px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 카테고리 */}
            <div className="seg-control">
              {(['urgent', 'notice', 'strategy', 'general'] as CategoryType[]).map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`seg-btn${category === c ? ' active' : ''}`}
                  style={category === c ? {
                    background: c === 'urgent' ? 'rgba(255,69,58,.2)' : c === 'notice' ? 'rgba(10,132,255,.2)' : c === 'strategy' ? 'rgba(255,159,10,.2)' : 'var(--bg-2)',
                    color: c === 'urgent' ? 'var(--red)' : c === 'notice' ? 'var(--blue)' : c === 'strategy' ? 'var(--orange)' : 'var(--label)',
                  } : {}}>
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>

            {/* 제목 */}
            {category === 'general'
              ? <input type="text" placeholder="제목" value={customTitle} onChange={e => setCustomTitle(e.target.value)} className="ios-input" />
              : <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-3)', fontSize: 15, fontWeight: 600, color: 'var(--label-2)' }}>{CATEGORY_AUTO_TITLE[category]}</div>
            }

            {/* 대상 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)', marginBottom: 8 }}>대상 선택</p>
              {TARGET_GROUPS.map(g => (
                <div key={g.label} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--label-3)', fontWeight: 500, marginRight: 8 }}>{g.label}</span>
                  <label style={{ marginRight: 12, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isGroupAllSelected(g)} onChange={() => toggleGroupAll(g)} style={{ marginRight: 4, accentColor: 'var(--blue)' }} />전체
                  </label>
                  {g.members.map(m => (
                    <label key={m} style={{ marginRight: 12, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedTargets.has(`${g.label}:${m}`)} onChange={() => toggleMember(g, m)} style={{ marginRight: 4, accentColor: 'var(--blue)' }} />{m}
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {/* 좌표 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>📍 좌표</p>
                  <span style={{ fontSize: 11, color: 'var(--label-3)', opacity: 0.7 }}>X·Y 모르면 생략 가능</span>
                </div>
                {showPerTargetToggle && (
                  <label style={{ fontSize: 12, cursor: 'pointer', color: 'var(--label-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="checkbox" checked={perTargetCoords} onChange={e => handlePerTargetToggle(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
                    대상별 다르게
                  </label>
                )}
              </div>
              {perTargetCoords && showPerTargetToggle ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {targets.map(t => {
                    const coord = targetCoords[t] || emptyCoord()
                    return (
                      <div key={t} style={{ background: 'var(--bg-4)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' }}>{t}</span>
                          {[{ ph: '지역명', val: coord.name, key: 'name', op: 1, fl: '2 1 70px' }, { ph: 'X (선택)', val: coord.x, key: 'x', op: 0.7, fl: '1 1 52px' }, { ph: 'Y (선택)', val: coord.y, key: 'y', op: 0.7, fl: '1 1 52px' }].map(({ ph, val, key, op, fl }) => (
                            <input key={ph} type="text" placeholder={ph} value={val}
                              onChange={e => updateTargetCoord(t, { [key]: e.target.value })}
                              style={{ ...inputSt, flex: fl, opacity: op, background: 'var(--bg-3)' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {COORD_ACTIONS.map(a => (
                            <label key={a} style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <input type="checkbox" checked={coord.actions.includes(a)} onChange={() => toggleTargetAction(t, a)} style={{ accentColor: 'var(--blue)' }} />{a}
                            </label>
                          ))}
                          {perTargetTime && (
                            <input type="time" value={targetTimes[t] ?? schedTime}
                              onChange={e => setTargetTimes(tt => ({ ...tt, [t]: e.target.value }))}
                              style={{ marginLeft: 4, padding: '3px 6px', borderRadius: 7, background: 'var(--bg-3)', color: 'var(--label)', border: 'none', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {[{ ph: '지역명', val: sharedCoord.name, key: 'name', op: 1, fl: '2 1 80px' }, { ph: 'X (선택)', val: sharedCoord.x, key: 'x', op: 0.7, fl: '1 1 56px' }, { ph: 'Y (선택)', val: sharedCoord.y, key: 'y', op: 0.7, fl: '1 1 56px' }].map(({ ph, val, key, op, fl }) => (
                      <input key={ph} type="text" placeholder={ph} value={val}
                        onChange={e => setSharedCoord(c => ({ ...c, [key]: e.target.value }))}
                        style={{ ...inputSt, flex: fl, opacity: op }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {COORD_ACTIONS.map(a => (
                      <label key={a} style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={sharedCoord.actions.includes(a)} onChange={() => toggleSharedAction(a)} style={{ accentColor: 'var(--blue)' }} />{a}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 날짜/시간 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>📆 날짜</span>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)} style={{ ...inputSt, flex: 'none' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>⏲ 시간</span>
                <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} style={{ ...inputSt, flex: 'none' }} />
                {showPerTargetToggle && perTargetCoords && (
                  <label style={{ fontSize: 12, cursor: 'pointer', color: 'var(--label-2)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                    <input type="checkbox" checked={perTargetTime} onChange={e => setPerTargetTime(e.target.checked)} style={{ accentColor: 'var(--blue)' }} />
                    대상별 다르게
                  </label>
                )}
              </div>
            </div>

            {/* 추가 메모 + 미리보기 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="seg-control" style={{ width: 180 }}>
                  {(['write', 'preview'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setPreviewMode(t === 'preview')}
                      className={`seg-btn${(t === 'preview') === previewMode ? ' active' : ''}`}>
                      {t === 'write' ? '추가 메모' : '미리보기'}
                    </button>
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-3)' }}>{extraContent.length}자</span>
              </div>
              {!previewMode
                ? <textarea placeholder="추가로 전달할 내용을 입력하세요..." value={extraContent} onChange={e => setExtraContent(e.target.value)}
                    rows={5} className="ios-input" style={{ resize: 'vertical', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 14, lineHeight: 1.7 }} />
                : <div className="notice-content ios-input" style={{ minHeight: 160, fontSize: 15 }}>
                    {buildContent().trim()
                      ? <MarkdownRenderer>{buildContent()}</MarkdownRenderer>
                      : <span style={{ color: 'var(--label-3)' }}>입력 내용이 없습니다</span>}
                  </div>
              }
            </div>

            {submitMsg && (
              <p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', color: submitMsg === 'success' ? 'var(--green)' : 'var(--red)' }}>
                {submitMsg === 'success' ? '공지가 등록되었습니다! 잠시 후 이동합니다.' : submitMsg === 'error-auth' ? '권한이 없습니다.' : submitMsg === 'error-title' ? '제목을 입력하세요.' : '오류가 발생했습니다.'}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? '등록 중...' : '공지 등록'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
