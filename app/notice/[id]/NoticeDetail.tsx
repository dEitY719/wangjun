'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import { useAdminAuth } from '@/app/hooks/useAdminAuth'
import type { Notice } from '@/lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  general: '일반',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    alert('URL이 복사되었습니다!')
  } catch {
    alert(window.location.href)
  }
}

export default function NoticeDetail({ notice }: { notice: Notice }) {
  const router = useRouter()
  const { isAdmin, password, ready, saveAuth } = useAdminAuth()

  const [showLogin, setShowLogin]   = useState(false)
  const [pwInput, setPwInput]       = useState('')
  const [loginError, setLoginError] = useState(false)
  const [logging, setLogging]       = useState(false)

  const handleQuickLogin = async () => {
    if (!pwInput.trim()) return
    setLogging(true); setLoginError(false)
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwInput }),
    })
    if (res.ok) {
      saveAuth(pwInput)
      setShowLogin(false); setPwInput('')
    } else {
      setLoginError(true)
    }
    setLogging(false)
  }

  const handleDelete = async () => {
    if (!confirm(`"${notice.title}" 공지를 삭제하시겠습니까?`)) return
    const res = await fetch(`/api/notices/${notice.id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    })
    if (res.ok) router.push('/')
    else alert('삭제 실패. 관리 페이지에서 다시 시도해주세요.')
  }

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 상단 네비게이션 */}
      <div style={{ paddingTop: 52, paddingBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 17, color: 'var(--blue)', textDecoration: 'none', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          공지
        </Link>

        {/* 관리자 영역 */}
        {ready && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isAdmin ? (
              /* 로그인 상태 → 수정/삭제 버튼 */
              <>
                <Link href={`/admin?edit=${notice.id}`} style={{
                  fontSize: 14, padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(10,132,255,0.15)', color: 'var(--blue)',
                  textDecoration: 'none', fontWeight: 600,
                }}>수정</Link>
                <button onClick={handleDelete} className="btn-danger" style={{ fontSize: 14 }}>삭제</button>
              </>
            ) : showLogin ? (
              /* 인증 폼 */
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={pwInput}
                  onChange={(e) => { setPwInput(e.target.value); setLoginError(false) }}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickLogin()}
                  autoFocus
                  style={{
                    width: 110, padding: '6px 10px', borderRadius: 8, border: 'none',
                    background: loginError ? 'rgba(255,69,58,0.15)' : 'var(--bg-2)',
                    color: 'var(--label)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button onClick={handleQuickLogin} disabled={logging} style={{
                  fontSize: 13, fontWeight: 600, padding: '6px 10px', borderRadius: 8, border: 'none',
                  background: 'rgba(10,132,255,0.2)', color: 'var(--blue)',
                  cursor: 'pointer', fontFamily: 'inherit', opacity: logging ? 0.5 : 1,
                }}>확인</button>
                <button onClick={() => { setShowLogin(false); setPwInput(''); setLoginError(false) }} style={{
                  fontSize: 13, padding: '6px 8px', borderRadius: 8, border: 'none',
                  background: 'none', color: 'var(--label-3)', cursor: 'pointer', fontFamily: 'inherit',
                }}>✕</button>
              </div>
            ) : (
              /* 비로그인 → 관리자 버튼 */
              <button onClick={() => setShowLogin(true)} style={{
                fontSize: 13, padding: '5px 10px', borderRadius: 8, border: 'none',
                background: 'none', color: 'var(--label-3)', cursor: 'pointer',
                fontFamily: 'inherit',
              }}>관리자</button>
            )}
          </div>
        )}
      </div>

      {/* 공지 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' as const }}>
          {notice.is_pinned && (
            <span style={{
              fontSize: 12, padding: '3px 9px', borderRadius: 100, fontWeight: 600,
              background: 'rgba(10,132,255,.15)', color: 'var(--blue)',
            }}>고정</span>
          )}
          <span
            className={`badge-${notice.category}`}
            style={{ fontSize: 12, padding: '3px 9px', borderRadius: 100, fontWeight: 600 }}
          >
            {CATEGORY_LABEL[notice.category]}
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 10 }}>
          {notice.title}
        </h1>

        {/* suppressHydrationWarning: 서버(Node.js)와 브라우저의 locale 날짜 포맷 차이 방지 */}
        <p style={{ fontSize: 14, color: 'var(--label-3)' }} suppressHydrationWarning>
          {formatDate(notice.created_at)}
        </p>
      </div>

      {/* 구분선 */}
      <div style={{ height: 1, background: 'var(--sep)', marginBottom: 24 }} />

      {/* 본문 */}
      <div className="notice-content" style={{ marginBottom: 32 }}>
        <MarkdownRenderer>{notice.content}</MarkdownRenderer>
      </div>

      {/* 공유 버튼 */}
      <button onClick={copyUrl} className="btn-primary" style={{ marginBottom: 8 }}>
        URL 복사 (카카오톡 공유용)
      </button>
    </div>
  )
}
