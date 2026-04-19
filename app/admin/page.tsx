'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import type { Notice } from '@/lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  general: '일반',
}

const DEFAULT_TEMPLATE = `## 공지 내용

[지역명](x좌표,y좌표) 주변으로 집결하세요.

## 상세 정보

| 항목 | 내용 |
|------|------|
| 집결 장소 | [지역명](x좌표,y좌표) |
| 집결 시간 | |
| 주의 사항 | |
`

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage() {
  const auth = useAdminAuth()

  // 로그인 폼 전용 상태 (auth.password는 sessionStorage 저장값)
  const [passwordInput, setPasswordInput] = useState('')
  const [authed, setAuthed]               = useState(false)
  const [authError, setAuthError]         = useState('')

  const [notices, setNotices]     = useState<Notice[]>([])
  const [loading, setLoading]     = useState(false)

  // 폼 상태
  const [editingId, setEditingId] = useState<number | null>(null)
  const [title, setTitle]         = useState('')
  const [content, setContent]     = useState('')
  const [category, setCategory]   = useState<'notice' | 'urgent' | 'general'>('notice')
  const [isPinned, setIsPinned]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write')

  // 좌표 삽입 헬퍼
  const [coordName, setCoordName] = useState('')
  const [coordX, setCoordX]       = useState('')
  const [coordY, setCoordY]       = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef     = useRef<HTMLDivElement>(null)

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notices')
    const data = await res.json()
    setNotices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  // sessionStorage에 저장된 세션이 있으면 자동 로그인
  useEffect(() => {
    if (auth.ready && auth.isAdmin && !authed) {
      setAuthed(true)
      fetchNotices()
    }
  }, [auth.ready, auth.isAdmin, authed, fetchNotices])

  // ?edit=ID 파라미터 처리 — 공지 상세에서 수정 버튼 클릭 시
  useEffect(() => {
    if (!authed) return
    const editId = new URLSearchParams(window.location.search).get('edit')
    if (!editId) return
    fetch(`/api/notices/${editId}`)
      .then((r) => r.json())
      .then((n: Notice) => {
        if (!n.id) return
        setEditingId(n.id)
        setTitle(n.title)
        setContent(n.content)
        setCategory(n.category)
        setIsPinned(n.is_pinned)
        setEditorTab('write')
        window.history.replaceState({}, '', '/admin')
        requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      })
      .catch(() => {})
  }, [authed])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput }),
    })
    if (res.ok) {
      auth.saveAuth(passwordInput)  // sessionStorage에 저장 → 다른 페이지에서도 인식
      setAuthed(true); setAuthError(''); fetchNotices()
    } else {
      setAuthError('비밀번호가 틀렸습니다')
    }
  }

  // API 호출에 쓸 비밀번호 (sessionStorage 저장값 우선)
  const adminPassword = auth.password || passwordInput

  const resetForm = () => {
    setEditingId(null); setTitle(''); setContent('')
    setCategory('notice'); setIsPinned(false)
    setEditorTab('write'); setSubmitMsg('')
  }

  const startEdit = (n: Notice) => {
    setEditingId(n.id)
    setTitle(n.title)
    setContent(n.content)
    setCategory(n.category)
    setIsPinned(n.is_pinned)
    setEditorTab('write')
    setSubmitMsg('')
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setSubmitMsg('제목과 내용을 모두 입력하세요.'); return }
    setSubmitting(true); setSubmitMsg('')

    const isEdit = editingId !== null
    const res = await fetch(isEdit ? `/api/notices/${editingId}` : '/api/notices', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
      body: JSON.stringify({ title, content, category, is_pinned: isPinned }),
    })

    if (res.ok) {
      resetForm()
      setSubmitMsg('success')
      fetchNotices()
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

  // 커서 위치에 텍스트 삽입
  const insertAtCursor = (text: string) => {
    const ta = textareaRef.current
    if (!ta) { setContent((c) => c + text); return }
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    setContent(content.slice(0, start) + text + content.slice(end))
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + text.length
      ta.focus()
    })
  }

  const handleInsertCoord = () => {
    if (!coordName.trim() || !coordX.trim() || !coordY.trim()) return
    insertAtCursor(`[${coordName.trim()}](${coordX.trim()},${coordY.trim()})`)
    setCoordName(''); setCoordX(''); setCoordY('')
  }

  /* ── Login ── */
  if (!auth.ready) return null  // sessionStorage 로드 대기

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

      {/* ── 공지 목록 (CRUD 버튼 포함) ── */}
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
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--label-2)', fontSize: 15 }} className="animate-pulse">
            불러오는 중...
          </p>
        ) : notices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--label-3)', fontSize: 15 }}>
            공지가 없습니다
          </p>
        ) : (
          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--bg-2)' }}>
            {notices.map((n, i) => {
              const isEditing = editingId === n.id
              return (
                <div key={n.id} style={{
                  padding: '12px 14px', position: 'relative',
                  background: isEditing ? 'rgba(10,132,255,0.08)' : undefined,
                }}>
                  {i > 0 && <div style={{ position: 'absolute', top: 0, left: 14, right: 0, height: 1, background: 'var(--sep)' }} />}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* 공지 정보 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span className={`badge-${n.category}`} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 100, fontWeight: 600 }}>
                          {CATEGORY_LABEL[n.category]}
                        </span>
                        {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--blue)' }}>고정</span>}
                        {isEditing && <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>수정 중</span>}
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{formatDate(n.created_at)}</p>
                    </div>

                    {/* CRUD 버튼 */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <a href={`/notice/${n.id}`} target="_blank" style={{
                        fontSize: 13, padding: '6px 10px', borderRadius: 8,
                        background: 'var(--fill-3)', color: 'var(--label-2)',
                        textDecoration: 'none', fontWeight: 500,
                      }}>보기</a>
                      <button
                        onClick={() => isEditing ? resetForm() : startEdit(n)}
                        style={{
                          fontSize: 13, padding: '6px 10px', borderRadius: 8, border: 'none',
                          background: isEditing ? 'rgba(255,159,10,0.18)' : 'rgba(10,132,255,0.15)',
                          color: isEditing ? 'var(--orange)' : 'var(--blue)',
                          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                        }}
                      >
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
              {editingId !== null && (
                <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>
                  ID {editingId} 수정 중
                </p>
              )}
            </div>
            {editingId !== null && (
              <button onClick={resetForm} style={{
                fontSize: 13, padding: '5px 12px', borderRadius: 8, border: 'none',
                background: 'var(--fill-3)', color: 'var(--label-2)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                취소
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Category + pin */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="seg-control" style={{ flex: 1, marginRight: 12 }}>
                {(['urgent', 'notice', 'general'] as const).map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={`seg-btn${category === c ? ' active' : ''}`}
                    style={category === c ? {
                      background: c === 'urgent' ? 'rgba(255,69,58,.2)' : c === 'notice' ? 'rgba(10,132,255,.2)' : 'var(--bg-2)',
                      color: c === 'urgent' ? 'var(--red)' : c === 'notice' ? 'var(--blue)' : 'var(--label)',
                    } : {}}>
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: 'var(--label-2)', whiteSpace: 'nowrap' }}>
                <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue)' }} />
                고정
              </label>
            </div>

            {/* Title */}
            <input type="text" placeholder="제목" value={title}
              onChange={(e) => setTitle(e.target.value)} className="ios-input" />

            {/* 좌표 삽입 헬퍼 */}
            <div style={{
              background: 'var(--bg-3)', borderRadius: 10, padding: '10px 12px',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 12, color: 'var(--label-3)', fontWeight: 600, minWidth: 60 }}>📍 좌표 삽입</span>
              {[
                { placeholder: '지역명', value: coordName, set: setCoordName, flex: '2 1 80px', min: 60 },
                { placeholder: 'X',     value: coordX,    set: setCoordX,    flex: '1 1 48px', min: 44 },
                { placeholder: 'Y',     value: coordY,    set: setCoordY,    flex: '1 1 48px', min: 44 },
              ].map(({ placeholder, value, set, flex, min }) => (
                <input key={placeholder} type="text" placeholder={placeholder} value={value}
                  onChange={(e) => set(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInsertCoord()}
                  style={{
                    flex, minWidth: min, padding: '5px 8px', borderRadius: 7,
                    background: 'var(--bg-4)', color: 'var(--label)', border: 'none',
                    fontSize: 13, outline: 'none', fontFamily: 'inherit',
                  }} />
              ))}
              <button type="button" onClick={handleInsertCoord} style={{
                padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                background: 'rgba(10,132,255,0.2)', color: 'var(--blue)',
                fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                opacity: (coordName && coordX && coordY) ? 1 : 0.4,
              }}>삽입</button>
            </div>

            {/* Editor 탭 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="seg-control" style={{ width: 180 }}>
                  {(['write', 'preview'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setEditorTab(t)}
                      className={`seg-btn${editorTab === t ? ' active' : ''}`}>
                      {t === 'write' ? '작성' : '미리보기'}
                    </button>
                  ))}
                </div>
                <button type="button"
                  onClick={() => { setContent(DEFAULT_TEMPLATE); setEditorTab('write') }}
                  style={{
                    fontSize: 12, padding: '5px 10px', borderRadius: 7, border: 'none',
                    background: 'var(--fill-3)', color: 'var(--label-2)',
                    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                  }}>기본 템플릿</button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-3)' }}>
                  {content.length}자 · {content.split('\n').length}줄
                </span>
              </div>

              {editorTab === 'write' ? (
                <textarea ref={textareaRef}
                  placeholder={`마크다운 지원\n\n**굵게**, *기울임*, ~~취소선~~\n# 제목, ## 소제목\n- 목록 항목\n> 인용구\n\`코드\`\n\n좌표: [낙양](1247,873)`}
                  value={content} onChange={(e) => setContent(e.target.value)}
                  rows={10} className="ios-input"
                  style={{ resize: 'vertical', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 14, lineHeight: 1.7 }} />
              ) : (
                <div className="notice-content ios-input" style={{ minHeight: 240, fontSize: 15 }}>
                  {content.trim()
                    ? <MarkdownRenderer>{content}</MarkdownRenderer>
                    : <span style={{ color: 'var(--label-3)' }}>내용을 입력하면 미리보기가 표시됩니다</span>}
                </div>
              )}
            </div>

            {submitMsg && (
              <p style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', color: submitMsg === 'success' ? 'var(--green)' : 'var(--red)' }}>
                {submitMsg === 'success'    ? (editingId !== null ? '수정 완료!' : '공지가 등록되었습니다!') :
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
