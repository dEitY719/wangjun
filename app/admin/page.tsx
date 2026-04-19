'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import type { Notice } from '@/lib/supabase'

type CategoryType = 'notice' | 'urgent' | 'general' | 'strategy'
type CoordData = { name: string; x: string; y: string; actions: string[] }

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  strategy: '전략',
  general: '일반',
}

const CATEGORY_AUTO_TITLE: Record<string, string> = {
  urgent: '🚨 긴급',
  notice: '📢 공지',
  strategy: '⚔️ 전략',
  general: '',
}

const TARGET_GROUPS = [
  { label: '촉나라', members: ['한나라', '대한제국', '호표기'] },
  { label: '오나라', members: ['은하수', '향', 'kor', '환'] },
]

const COORD_ACTIONS = ['공성', '진출', '공격', '수비', '요새 건설']

function nowDate() { return new Date().toISOString().slice(0, 10) }
function nowTime() { return new Date().toTimeString().slice(0, 5) }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const emptyCoord = (): CoordData => ({ name: '', x: '', y: '', actions: [] })

export default function AdminPage() {
  const auth = useAdminAuth()

  const [passwordInput, setPasswordInput] = useState('')
  const [authed, setAuthed]               = useState(false)
  const [authError, setAuthError]         = useState('')

  const [notices, setNotices]   = useState<Notice[]>([])
  const [loading, setLoading]   = useState(false)

  // 폼 상태
  const [editingId, setEditingId]   = useState<number | null>(null)
  const [category, setCategory]     = useState<CategoryType>('notice')
  const [customTitle, setCustomTitle] = useState('💬 일반')
  const [isPinned, setIsPinned]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg]   = useState('')

  // 대상
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set())

  // 좌표
  const [perTargetCoords, setPerTargetCoords] = useState(false)
  const [sharedCoord, setSharedCoord]         = useState<CoordData>(emptyCoord())
  const [targetCoords, setTargetCoords]       = useState<Record<string, CoordData>>({})

  // 날짜/시간
  const [schedDate, setSchedDate]       = useState(nowDate)
  const [schedTime, setSchedTime]       = useState(nowTime)
  const [perTargetTime, setPerTargetTime] = useState(false)
  const [targetTimes, setTargetTimes]   = useState<Record<string, string>>({})

  // 추가 메모
  const [extraContent, setExtraContent] = useState('')

  const [previewMode, setPreviewMode] = useState(false)

  const formRef = useRef<HTMLDivElement>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notices')
    const data = await res.json()
    setNotices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (auth.ready && auth.isAdmin && !authed) {
      setAuthed(true)
      fetchNotices()
    }
  }, [auth.ready, auth.isAdmin, authed, fetchNotices])

  // 파생 계산
  const effectiveTargets = (): string[] => {
    const result: string[] = []
    TARGET_GROUPS.forEach(g => {
      g.members.forEach(m => {
        if (selectedTargets.has(`${g.label}:${m}`)) result.push(m)
      })
    })
    return result
  }

  const getFinalTitle = () =>
    category === 'general' ? customTitle.trim() : CATEGORY_AUTO_TITLE[category]

  const buildContent = (): string => {
    const blocks: string[] = []
    const targets = effectiveTargets()

    if (perTargetCoords && targets.length > 1) {
      // CoordBadge가 [name](x,y) → "📍 name (x,y)" 로 렌더링하므로 수동 📍 불필요
      const coordLines = targets.map(t => {
        const coord = targetCoords[t] || emptyCoord()
        const actionStr = coord.actions.join(' ')
        const timeStr = perTargetTime ? (targetTimes[t] || schedTime) : ''
        if (coord.name && coord.x && coord.y) {
          return `**${t}**: [${coord.name}](${coord.x},${coord.y})${actionStr ? ' ' + actionStr : ''}${timeStr ? ' ⏲ ' + timeStr : ''}`
        }
        return `**${t}**: (좌표 미입력)`
      })
      blocks.push(coordLines.join('  \n'))
    } else {
      if (targets.length > 0) blocks.push(`대상: ${targets.join(', ')} 맹원분들은`)
      if (sharedCoord.name && sharedCoord.x && sharedCoord.y) {
        const actionStr = sharedCoord.actions.join(' ')
        blocks.push(`[${sharedCoord.name}](${sharedCoord.x},${sharedCoord.y})${actionStr ? ' ' + actionStr : ''}`)
      }
    }

    const dateStr = schedDate ? `📆 ${schedDate.slice(2).replace(/-/g, '-')}` : ''
    const sharedTimeStr = (!perTargetTime || !perTargetCoords || targets.length <= 1) && schedTime ? `⏲ ${schedTime}` : ''
    if (dateStr || sharedTimeStr) blocks.push(`${dateStr}${sharedTimeStr ? ' ' + sharedTimeStr : ''}`.trim())

    if (extraContent.trim()) blocks.push(extraContent.trim())

    return blocks.join('\n\n')
  }

  const adminPassword = auth.password || passwordInput

  const resetForm = useCallback(() => {
    setEditingId(null)
    setCategory('notice')
    setCustomTitle('💬 일반')
    setSelectedTargets(new Set())
    setPerTargetCoords(false)
    setSharedCoord(emptyCoord())
    setTargetCoords({})
    setSchedDate(nowDate())
    setSchedTime(nowTime())
    setPerTargetTime(false)
    setTargetTimes({})
    setExtraContent('')
    setIsPinned(false)
    setPreviewMode(false)
    setSubmitMsg('')
  }, [])

  const startEdit = useCallback((n: Notice) => {
    setEditingId(n.id)
    // 제목이 자동 제목과 일치하면 카테고리 복원, 아니면 일반으로
    const matchedCat = (Object.entries(CATEGORY_AUTO_TITLE) as [CategoryType, string][])
      .find(([, t]) => t === n.title.trim())
    if (matchedCat) {
      setCategory(matchedCat[0])
      setCustomTitle('💬 일반')
    } else {
      setCategory('general')
      setCustomTitle(n.title)
    }
    setExtraContent(n.content)
    setIsPinned(n.is_pinned)
    setSelectedTargets(new Set())
    setPerTargetCoords(false)
    setSharedCoord(emptyCoord())
    setTargetCoords({})
    setSchedDate(nowDate())
    setSchedTime(nowTime())
    setPerTargetTime(false)
    setTargetTimes({})
    setPreviewMode(false)
    setSubmitMsg('')
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  useEffect(() => {
    if (!authed) return
    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId) return
    fetch(`/api/notices/${editId}`)
      .then((r) => r.json())
      .then((n: Notice) => {
        if (!n.id) return
        startEdit(n)
        window.history.replaceState({}, '', '/admin')
      })
      .catch(() => {})
  }, [authed, startEdit])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput }),
    })
    if (res.ok) {
      auth.saveAuth(passwordInput)
      setAuthed(true); setAuthError(''); fetchNotices()
    } else {
      setAuthError('비밀번호가 틀렸습니다')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = getFinalTitle()
    const finalContent = buildContent()
    if (!finalTitle) { setSubmitMsg('error-title'); return }
    setSubmitting(true); setSubmitMsg('')

    const isEdit = editingId !== null
    const res = await fetch(isEdit ? `/api/notices/${editingId}` : '/api/notices', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ title: finalTitle, content: finalContent, category, is_pinned: isPinned }),
    })

    if (res.ok) {
      resetForm(); setSubmitMsg('success'); fetchNotices()
    } else if (res.status === 401) {
      setSubmitMsg('error-auth')
    } else {
      setSubmitMsg('error')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/notices/${id}`, { method: 'DELETE', headers: { 'x-admin-password': adminPassword } })
    if (editingId === id) resetForm()
    fetchNotices()
  }

  // 대상 토글
  const isGroupAllSelected = (g: typeof TARGET_GROUPS[0]) =>
    g.members.every(m => selectedTargets.has(`${g.label}:${m}`))

  const toggleGroupAll = (g: typeof TARGET_GROUPS[0]) => {
    const next = new Set(selectedTargets)
    if (isGroupAllSelected(g)) {
      g.members.forEach(m => next.delete(`${g.label}:${m}`))
    } else {
      g.members.forEach(m => next.add(`${g.label}:${m}`))
    }
    setSelectedTargets(next)
  }

  const toggleMember = (g: typeof TARGET_GROUPS[0], member: string) => {
    const key = `${g.label}:${member}`
    const next = new Set(selectedTargets)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelectedTargets(next)
  }

  // 좌표 헬퍼
  const toggleSharedAction = (action: string) =>
    setSharedCoord(c => ({
      ...c,
      actions: c.actions.includes(action) ? c.actions.filter(a => a !== action) : [...c.actions, action],
    }))

  const updateTargetCoord = (target: string, patch: Partial<CoordData>) =>
    setTargetCoords(tc => ({ ...tc, [target]: { ...(tc[target] || emptyCoord()), ...patch } }))

  const toggleTargetAction = (target: string, action: string) =>
    setTargetCoords(tc => {
      const coord = tc[target] || emptyCoord()
      return {
        ...tc,
        [target]: {
          ...coord,
          actions: coord.actions.includes(action)
            ? coord.actions.filter(a => a !== action)
            : [...coord.actions, action],
        },
      }
    })

  const handlePerTargetToggle = (val: boolean) => {
    if (val) {
      const targets = effectiveTargets()
      const initial: Record<string, CoordData> = {}
      targets.forEach(t => { initial[t] = targetCoords[t] || { ...sharedCoord } })
      setTargetCoords(initial)
    }
    setPerTargetCoords(val)
  }

  /* ── Login ── */
  if (!auth.ready) return null

  if (!authed) {
    return (
      <div style={{ padding: '52px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 32, textAlign: 'center' }}>관리자 로그인</h1>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" placeholder="관리자 비밀번호" value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)} className="ios-input" />
            {authError && <p style={{ fontSize: 14, color: 'var(--red)', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>입장</button>
          </form>
        </div>
      </div>
    )
  }

  const targets = effectiveTargets()
  const showPerTargetToggle = targets.length > 1

  /* ── Dashboard ── */
  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--label-3)' }}>비밀번호</span>
          <input type="password" value={auth.password} onChange={(e) => auth.saveAuth(e.target.value)}
            className="ios-input" style={{ width: 100, padding: '7px 12px', fontSize: 14, borderRadius: 8 }} />
        </div>
      </div>

      {/* ── 공지 목록 ── */}
      <div style={{ padding: '0 16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '0 2px' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            공지 목록 {notices.length > 0 && `(${notices.length})`}
          </p>
          <button
            onClick={() => { resetForm(); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }}
            style={{
              fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
              background: 'rgba(10,132,255,0.15)', color: 'var(--blue)', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            + 새 공지
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--label-2)', fontSize: 15 }} className="animate-pulse">불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--label-3)', fontSize: 15 }}>공지가 없습니다</p>
        ) : (
          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg-2)' }}>
            {notices.map((n, i) => {
              const isEditing = editingId === n.id
              return (
                <div key={n.id} style={{ padding: '12px 14px', position: 'relative', background: isEditing ? 'rgba(10,132,255,0.08)' : undefined }}>
                  {i > 0 && <div style={{ position: 'absolute', top: 0, left: 14, right: 0, height: 1, background: 'var(--sep)' }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span className={`badge-${n.category}`} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 100, fontWeight: 600 }}>
                          {CATEGORY_LABEL[n.category]}
                        </span>
                        {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--blue)' }}>고정</span>}
                        {isEditing && <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>수정 중</span>}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{formatDate(n.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={`/notice/${n.id}`} target="_blank" style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, background: 'var(--fill-3)', color: 'var(--label-2)', textDecoration: 'none', fontWeight: 500 }}>보기</a>
                      <button onClick={() => isEditing ? resetForm() : startEdit(n)}
                        style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: 'none', background: isEditing ? 'rgba(255,159,10,0.18)' : 'rgba(10,132,255,0.15)', color: isEditing ? 'var(--orange)' : 'var(--blue)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        {isEditing ? '취소' : '수정'}
                      </button>
                      <button onClick={() => handleDelete(n.id)} className="btn-danger">삭제</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 작성 / 수정 폼 ── */}
      <div ref={formRef} style={{ margin: '0 16px 24px', scrollMarginTop: 16 }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '18px 16px' }}>

          {/* 폼 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.2 }}>
                {editingId !== null ? '공지 수정' : '새 공지 작성'}
              </h2>
              {editingId !== null && <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>ID {editingId} 수정 중</p>}
            </div>
            {editingId !== null && (
              <button onClick={resetForm} style={{ fontSize: 13, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--fill-3)', color: 'var(--label-2)', cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ① 카테고리 + 고정 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div className="seg-control" style={{ flex: 1 }}>
                {(['urgent', 'notice', 'strategy', 'general'] as CategoryType[]).map((c) => (
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: 'var(--label-2)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--blue)' }} />
                고정
              </label>
            </div>

            {/* ② 제목 (일반만 노출) */}
            {category === 'general' && (
              <input type="text" placeholder="제목" value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)} className="ios-input" />
            )}
            {category !== 'general' && (
              <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-3)', fontSize: 15, fontWeight: 600, color: 'var(--label-2)' }}>
                {CATEGORY_AUTO_TITLE[category]}
              </div>
            )}

            {/* ③ 대상 선택 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)', marginBottom: 8 }}>대상 선택</p>
              {TARGET_GROUPS.map(g => (
                <div key={g.label} style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--label-3)', fontWeight: 500, marginRight: 8 }}>{g.label}</span>
                  <label style={{ marginRight: 12, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={isGroupAllSelected(g)} onChange={() => toggleGroupAll(g)}
                      style={{ marginRight: 4, accentColor: 'var(--blue)' }} />
                    전체
                  </label>
                  {g.members.map(m => (
                    <label key={m} style={{ marginRight: 12, fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectedTargets.has(`${g.label}:${m}`)} onChange={() => toggleMember(g, m)}
                        style={{ marginRight: 4, accentColor: 'var(--blue)' }} />
                      {m}
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {/* ④ 좌표 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>📍 좌표</p>
                {showPerTargetToggle && (
                  <label style={{ fontSize: 12, cursor: 'pointer', color: 'var(--label-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="checkbox" checked={perTargetCoords} onChange={(e) => handlePerTargetToggle(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }} />
                    대상별 다르게
                  </label>
                )}
              </div>

              {perTargetCoords && showPerTargetToggle ? (
                // 대상별 좌표 입력
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {targets.map(t => {
                    const coord = targetCoords[t] || emptyCoord()
                    return (
                      <div key={t} style={{ background: 'var(--bg-4)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(10,132,255,0.15)', color: 'var(--blue)' }}>{t}</span>
                          {[
                            { ph: '지역명', val: coord.name, key: 'name', flex: '2 1 70px' },
                            { ph: 'X',     val: coord.x,    key: 'x',    flex: '1 1 44px' },
                            { ph: 'Y',     val: coord.y,    key: 'y',    flex: '1 1 44px' },
                          ].map(({ ph, val, key, flex }) => (
                            <input key={ph} type="text" placeholder={ph} value={val}
                              onChange={(e) => updateTargetCoord(t, { [key]: e.target.value })}
                              style={{ flex, minWidth: 40, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-3)', color: 'var(--label)', border: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                          {COORD_ACTIONS.map(a => (
                            <label key={a} style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <input type="checkbox" checked={coord.actions.includes(a)} onChange={() => toggleTargetAction(t, a)}
                                style={{ accentColor: 'var(--blue)' }} />
                              {a}
                            </label>
                          ))}
                          {perTargetTime && (
                            <input type="time" value={targetTimes[t] ?? schedTime}
                              onChange={(e) => setTargetTimes(tt => ({ ...tt, [t]: e.target.value }))}
                              style={{ marginLeft: 4, padding: '3px 6px', borderRadius: 7, background: 'var(--bg-3)', color: 'var(--label)', border: 'none', fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                // 공유 좌표 입력
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {[
                      { ph: '지역명', val: sharedCoord.name, key: 'name', flex: '2 1 80px' },
                      { ph: 'X',     val: sharedCoord.x,    key: 'x',    flex: '1 1 48px' },
                      { ph: 'Y',     val: sharedCoord.y,    key: 'y',    flex: '1 1 48px' },
                    ].map(({ ph, val, key, flex }) => (
                      <input key={ph} type="text" placeholder={ph} value={val}
                        onChange={(e) => setSharedCoord(c => ({ ...c, [key]: e.target.value }))}
                        style={{ flex, minWidth: 44, padding: '5px 8px', borderRadius: 7, background: 'var(--bg-4)', color: 'var(--label)', border: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {COORD_ACTIONS.map(a => (
                      <label key={a} style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={sharedCoord.actions.includes(a)} onChange={() => toggleSharedAction(a)}
                          style={{ accentColor: 'var(--blue)' }} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ⑤ 날짜 & 시간 */}
            <div style={{ background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>📆 날짜</span>
                <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 7, background: 'var(--bg-4)', color: 'var(--label)', border: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--label-3)' }}>⏲ 시간</span>
                <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 7, background: 'var(--bg-4)', color: 'var(--label)', border: 'none', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                {showPerTargetToggle && perTargetCoords && (
                  <label style={{ fontSize: 12, cursor: 'pointer', color: 'var(--label-2)', display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                    <input type="checkbox" checked={perTargetTime} onChange={(e) => setPerTargetTime(e.target.checked)}
                      style={{ accentColor: 'var(--blue)' }} />
                    대상별 다르게
                  </label>
                )}
              </div>
              {perTargetTime && perTargetCoords && showPerTargetToggle && (
                <p style={{ fontSize: 11, color: 'var(--label-3)', marginTop: 6 }}>각 대상 좌표 행에서 시간을 개별 설정하세요</p>
              )}
            </div>

            {/* ⑥ 추가 메모 + 미리보기 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="seg-control" style={{ width: 180 }}>
                  {(['write', 'preview'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setPreviewMode(t === 'preview')}
                      className={`seg-btn${(t === 'preview') === previewMode ? ' active' : ''}`}>
                      {t === 'write' ? '추가 메모' : '미리보기'}
                    </button>
                  ))}
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-3)' }}>
                  {extraContent.length}자
                </span>
              </div>

              {!previewMode ? (
                <textarea
                  placeholder="추가로 전달할 내용을 입력하세요..."
                  value={extraContent} onChange={(e) => setExtraContent(e.target.value)}
                  rows={5} className="ios-input"
                  style={{ resize: 'vertical', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 14, lineHeight: 1.7 }} />
              ) : (
                <div className="notice-content ios-input" style={{ minHeight: 160, fontSize: 15 }}>
                  {buildContent().trim()
                    ? <MarkdownRenderer>{buildContent()}</MarkdownRenderer>
                    : <span style={{ color: 'var(--label-3)' }}>입력 내용이 없습니다</span>}
                </div>
              )}
            </div>

            {submitMsg && (
              <p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', color: submitMsg === 'success' ? 'var(--green)' : 'var(--red)' }}>
                {submitMsg === 'success'    ? (editingId !== null ? '수정 완료!' : '공지가 등록되었습니다!') :
                 submitMsg === 'error-title' ? '제목을 입력하세요.' :
                 submitMsg === 'error-auth' ? '비밀번호가 틀렸습니다.' : '오류가 발생했습니다.'}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary"
              style={editingId !== null ? { background: 'var(--orange)' } : {}}>
              {submitting ? '처리 중...' : editingId !== null ? '수정 완료' : '공지 등록'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
