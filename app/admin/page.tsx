'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Notice } from '@/lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  general: '일반',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage() {
  const [password, setPassword]   = useState('')
  const [authed, setAuthed]       = useState(false)
  const [authError, setAuthError] = useState('')

  const [notices, setNotices]     = useState<Notice[]>([])
  const [loading, setLoading]     = useState(false)

  const [title, setTitle]         = useState('')
  const [content, setContent]     = useState('')
  const [category, setCategory]   = useState<'notice' | 'urgent' | 'general'>('notice')
  const [isPinned, setIsPinned]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write')

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/notices')
    const data = await res.json()
    setNotices(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setAuthed(true)
      setAuthError('')
      fetchNotices()
    } else {
      setAuthError('비밀번호가 틀렸습니다')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setSubmitMsg('제목과 내용을 모두 입력하세요.')
      return
    }
    setSubmitting(true)
    setSubmitMsg('')

    const res = await fetch('/api/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ title, content, category, is_pinned: isPinned }),
    })

    if (res.ok) {
      setTitle(''); setContent(''); setCategory('notice')
      setIsPinned(false); setEditorTab('write')
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
    await fetch(`/api/notices/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    })
    fetchNotices()
  }

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div style={{ padding: '52px 16px 0', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, marginBottom: 32, textAlign: 'center' }}>관리자 로그인</h1>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ios-input"
            />
            {authError && (
              <p style={{ fontSize: 14, color: 'var(--red)', textAlign: 'center' }}>{authError}</p>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>입장</button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Admin dashboard ── */
  return (
    <div>
      {/* Large Title */}
      <div style={{ padding: '52px 20px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.1 }}>관리</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4 }}>
          <span style={{ fontSize: 13, color: 'var(--label-3)' }}>비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ios-input"
            style={{ width: 100, padding: '7px 12px', fontSize: 14, borderRadius: 8 }}
          />
        </div>
      </div>

      {/* Create form */}
      <div style={{ margin: '0 16px 24px' }}>
        <div style={{ background: 'var(--bg-2)', borderRadius: 12, padding: '18px 16px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16, letterSpacing: -0.2 }}>공지 작성</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>

            {/* Category + pin */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="seg-control" style={{ flex: 1, marginRight: 12 }}>
                {(['urgent', 'notice', 'general'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`seg-btn${category === c ? ' active' : ''}`}
                    style={category === c ? {
                      background: c === 'urgent' ? 'rgba(255,69,58,.2)' : c === 'notice' ? 'rgba(10,132,255,.2)' : 'var(--bg-2)',
                      color: c === 'urgent' ? 'var(--red)' : c === 'notice' ? 'var(--blue)' : 'var(--label)',
                    } : {}}
                  >
                    {CATEGORY_LABEL[c]}
                  </button>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', color: 'var(--label-2)', whiteSpace: 'nowrap' as const }}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--blue)' }}
                />
                고정
              </label>
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ios-input"
            />

            {/* Editor tabs */}
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
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--label-3)' }}>
                  {content.length}자 · {content.split('\n').length}줄
                </span>
              </div>

              {editorTab === 'write' ? (
                <textarea
                  placeholder={`마크다운 지원\n\n**굵게**, *기울임*, ~~취소선~~\n# 제목, ## 소제목\n- 목록 항목\n> 인용구\n\`코드\``}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="ios-input"
                  style={{ resize: 'vertical', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 14, lineHeight: 1.7 }}
                />
              ) : (
                <div className="notice-content ios-input" style={{ minHeight: 240, fontSize: 15 }}>
                  {content.trim()
                    ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                    : <span style={{ color: 'var(--label-3)' }}>내용을 입력하면 미리보기가 표시됩니다</span>
                  }
                </div>
              )}
            </div>

            {submitMsg && (
              <p style={{
                fontSize: 14, fontWeight: 500, textAlign: 'center',
                color: submitMsg === 'success' ? 'var(--green)' : 'var(--red)',
              }}>
                {submitMsg === 'success'   ? '공지가 등록되었습니다!'    :
                 submitMsg === 'error-auth' ? '비밀번호가 틀렸습니다.'   : '오류가 발생했습니다.'}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? '등록 중...' : '공지 등록'}
            </button>
          </form>
        </div>
      </div>

      {/* Notice list */}
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--label-3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, padding: '0 4px' }}>
          등록된 공지 {notices.length > 0 && `(${notices.length})`}
        </p>

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
            {notices.map((n, i) => (
              <div key={n.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
                {i > 0 && <div style={{ position: 'absolute', top: 0, left: 14, right: 0, height: 1, background: 'var(--sep)' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                    <span className={`badge-${n.category}`} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 100, fontWeight: 600 }}>
                      {CATEGORY_LABEL[n.category]}
                    </span>
                    {n.is_pinned && <span style={{ fontSize: 11, color: 'var(--blue)' }}>고정</span>}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--label-3)', marginTop: 2 }}>{formatDate(n.created_at)}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a
                    href={`/notice/${n.id}`}
                    target="_blank"
                    style={{
                      fontSize: 13, padding: '6px 12px', borderRadius: 8,
                      background: 'var(--fill-3)', color: 'var(--label-2)',
                      textDecoration: 'none', fontWeight: 500,
                    }}
                  >
                    보기
                  </a>
                  <button onClick={() => handleDelete(n.id)} className="btn-danger">삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
