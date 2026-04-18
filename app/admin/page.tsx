'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Notice } from '@/lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '🚨 긴급',
  notice: '📢 공지',
  general: '💬 일반',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')

  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<'notice' | 'urgent' | 'general'>('notice')
  const [isPinned, setIsPinned] = useState(false)
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
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ title, content, category, is_pinned: isPinned }),
    })

    if (res.ok) {
      setTitle('')
      setContent('')
      setCategory('notice')
      setIsPinned(false)
      setEditorTab('write')
      setSubmitMsg('✅ 공지가 등록되었습니다!')
      fetchNotices()
    } else if (res.status === 401) {
      setSubmitMsg('❌ 비밀번호가 틀렸습니다.')
    } else {
      setSubmitMsg('❌ 오류가 발생했습니다.')
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

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20">
        <div className="card p-6">
          <h1 className="text-xl font-bold mb-6 text-center" style={{ color: 'var(--accent)' }}>
            🔐 관리자 로그인
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="관리자 비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-white outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            />
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button type="submit" className="btn-primary w-full py-3">
              입장
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>📝 공지 작성</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-28 px-2 py-1 rounded text-white text-xs outline-none"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 카테고리 + 고정 */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2">
              {(['urgent', 'notice', 'general'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-opacity badge-${c}`}
                  style={{ opacity: category === c ? 1 : 0.4 }}
                >
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded"
              />
              📌 고정
            </label>
          </div>

          {/* 제목 */}
          <input
            type="text"
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg text-white outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          />

          {/* 작성 / 미리보기 탭 */}
          <div>
            <div className="flex gap-1 mb-2">
              {(['write', 'preview'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setEditorTab(tab)}
                  className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                  style={{
                    background: editorTab === tab ? 'var(--accent)' : 'var(--surface2)',
                    color: editorTab === tab ? '#0f1117' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {tab === 'write' ? '✏️ 작성' : '👁 미리보기'}
                </button>
              ))}
              <span className="ml-auto text-xs self-center" style={{ color: 'var(--text-muted)' }}>
                {content.length}자 / {content.split('\n').length}줄
              </span>
            </div>

            {editorTab === 'write' ? (
              <textarea
                placeholder={`마크다운 문법 지원\n\n**굵게**, *기울임*, ~~취소선~~\n# 제목, ## 소제목\n- 목록 항목\n1. 번호 목록\n> 인용구\n\`코드\``}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-lg text-white outline-none resize-none font-mono text-sm"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', lineHeight: '1.7' }}
              />
            ) : (
              <div
                className="w-full px-4 py-3 rounded-lg min-h-[240px] notice-content"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                {content.trim() ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>내용을 입력하면 미리보기가 표시됩니다.</span>
                )}
              </div>
            )}
          </div>

          {submitMsg && (
            <p className="text-sm font-medium" style={{ color: submitMsg.startsWith('✅') ? '#4caf50' : '#e05c5c' }}>
              {submitMsg}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? '등록 중...' : '공지 등록'}
          </button>
        </form>
      </div>

      {/* 공지 목록 */}
      <div>
        <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--text-muted)' }}>
          등록된 공지 ({notices.length})
        </h2>
        {loading ? (
          <p className="text-center py-8 animate-pulse" style={{ color: 'var(--text-muted)' }}>불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>공지가 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {notices.map((n) => (
              <div key={n.id} className="card p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full badge-${n.category}`}>
                      {CATEGORY_LABEL[n.category]}
                    </span>
                    {n.is_pinned && <span className="text-xs" style={{ color: 'var(--accent)' }}>📌</span>}
                  </div>
                  <p className="font-medium text-sm truncate">{n.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(n.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={`/notice/${n.id}`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    보기
                  </a>
                  <button onClick={() => handleDelete(n.id)} className="btn-danger text-xs py-1.5">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
