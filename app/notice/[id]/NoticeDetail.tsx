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
  strategy: '전략',
  general: '일반',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** 마크다운 → 카카오톡 순수 텍스트 변환 */
function markdownToKakao(title: string, md: string): string {
  const body = md
    // 코드 블록 제거 (내용만 유지)
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
    // 제목 (## → 그대로, # 기호만 제거)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // 구분선
    .replace(/^---+$/gm, '──────────────────')
    // 굵게 / 기울임 / 취소선
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    // 좌표 링크 [지역명](x,y) → 📍지역명(x,y)
    .replace(/\[([^\]]+)\]\((\d+),(\d+)\)/g, '📍$1($2,$3)')
    // 좌표 미입력 링크 [지역명](map-search) → 📍지역명
    .replace(/\[([^\]]+)\]\(map-search\)/g, '📍$1')
    // 일반 링크
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 인용구 (> ...)
    .replace(/^>\s*/gm, '  ')
    // 비순서 목록
    .replace(/^[-*+]\s+/gm, '• ')
    // 인라인 코드
    .replace(/`(.+?)`/g, '$1')
    // 표 구분선 행 제거
    .replace(/^\|[-| :]+\|$/gm, '')
    // 표 데이터 행
    .replace(/^\|(.+)\|$/gm, (_, row: string) =>
      row.split('|').map((c) => c.trim()).filter(Boolean).join('  '))
    // 3줄 이상 공백 → 2줄로
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return `[${title}]\n\n${body}`
}

export default function NoticeDetail({ notice }: { notice: Notice }) {
  const router = useRouter()
  const { isAdmin, password, ready, saveAuth } = useAdminAuth()

  const [showLogin, setShowLogin]   = useState(false)
  const [pwInput, setPwInput]       = useState('')
  const [loginError, setLoginError] = useState(false)
  const [logging, setLogging]       = useState(false)

  const [copied, setCopied] = useState<'msg' | 'url' | null>(null)

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

  const copyMsg = async () => {
    const text = markdownToKakao(notice.title, notice.content)
    try {
      await navigator.clipboard.writeText(text)
      setCopied('msg')
      setTimeout(() => setCopied(null), 2500)
    } catch {
      alert(text)
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied('url')
      setTimeout(() => setCopied(null), 2500)
    } catch {
      alert(window.location.href)
    }
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
              <>
                <Link href={`/admin?edit=${notice.id}`} style={{
                  fontSize: 14, padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(10,132,255,0.15)', color: 'var(--blue)',
                  textDecoration: 'none', fontWeight: 600,
                }}>수정</Link>
                <button onClick={handleDelete} className="btn-danger" style={{ fontSize: 14 }}>삭제</button>
              </>
            ) : showLogin ? (
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
              <button onClick={() => setShowLogin(true)} style={{
                fontSize: 13, padding: '5px 10px', borderRadius: 8, border: 'none',
                background: 'none', color: 'var(--label-3)', cursor: 'pointer', fontFamily: 'inherit',
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
          <span className={`badge-${notice.category}`}
            style={{ fontSize: 12, padding: '3px 9px', borderRadius: 100, fontWeight: 600 }}>
            {CATEGORY_LABEL[notice.category]}
          </span>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 10 }}>
          {notice.title}
        </h1>

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
        {/* 카카오톡 메시지 복사 */}
        <button onClick={copyMsg} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: copied === 'msg' ? 'rgba(48,209,88,0.18)' : '#FEE500',
          color: copied === 'msg' ? 'var(--green)' : '#3A1D1D',
          fontWeight: 700, borderRadius: 14, padding: '15px 20px', fontSize: 16,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all .2s',
        }}>
          {copied === 'msg' ? (
            <>✓ 복사됨</>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <path d="M12 3C6.48 3 2 6.92 2 11.7c0 2.9 1.58 5.47 4.04 7.1L5.1 21.9l3.5-1.86c1.1.3 2.22.46 3.4.46 5.52 0 10-3.92 10-8.7C22 6.92 17.52 3 12 3z"/>
              </svg>
              카카오톡 전달 메시지 복사
            </>
          )}
        </button>

        {/* URL 복사 */}
        <button onClick={copyUrl} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: copied === 'url' ? 'rgba(48,209,88,0.12)' : 'var(--bg-2)',
          color: copied === 'url' ? 'var(--green)' : 'var(--label-2)',
          fontWeight: 600, borderRadius: 14, padding: '13px 20px', fontSize: 15,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all .2s',
        }}>
          {copied === 'url' ? '✓ URL 복사됨' : '🔗 URL 복사'}
        </button>
      </div>
    </div>
  )
}
