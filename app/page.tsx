'use client'

import { useEffect, useState } from 'react'
import type { Notice } from '@/lib/supabase'
import { useMemberAuth } from '@/app/hooks/useMemberAuth'
import MemberLoginModal from '@/app/components/MemberLoginModal'
import PassphraseGate from '@/app/components/PassphraseGate'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  strategy: '전략',
  general: '일반',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const diffH = Math.floor((Date.now() - d.getTime()) / 3_600_000)
  if (diffH < 1) return '방금 전'
  if (diffH < 24) return `${diffH}시간 전`
  const diffD = Math.floor(diffH / 24)
  if (diffD < 7) return `${diffD}일 전`
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function stripMd(s: string) {
  return s
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*+>]\s+/gm, '')
    .replace(/\n/g, ' ')
    .trim()
}

export default function Home() {
  const [notices, setNotices]     = useState<Notice[]>([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const { session, ready }        = useMemberAuth()

  useEffect(() => {
    fetch('/api/notices')
      .then((r) => r.json())
      .then((data) => { setNotices(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <PassphraseGate>
    <div>
      {/* 운영진 로그인 아이콘 */}
      <button onClick={() => setShowModal(true)} style={{
        position: 'fixed', top: 12, right: 16, zIndex: 100,
        background: session ? 'rgba(10,132,255,0.15)' : 'var(--fill-3)',
        border: 'none', borderRadius: 20, padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 5,
        cursor: 'pointer', color: session ? 'var(--blue)' : 'var(--label-3)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        {ready && session && <span style={{ fontSize: 12, fontWeight: 600 }}>{session.displayName || session.id}</span>}
      </button>

      {showModal && <MemberLoginModal onClose={() => setShowModal(false)} />}

      {/* 메인 타이틀 */}
      <div style={{ paddingTop: 52, textAlign: 'center' }}>
        <img src="/main-title.png" alt="삼국지 왕전" style={{ maxWidth: '100%', display: 'inline-block' }} />
      </div>

      {/* 공지 배너 */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <img src="/notice.png" alt="공지 사항" style={{ maxWidth: '100%', display: 'inline-block' }} />
      </div>

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, color: 'var(--label-2)' }} className="animate-pulse">불러오는 중...</div>
        </div>
      ) : notices.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 17, color: 'var(--label-2)', marginBottom: 4 }}>아직 공지가 없습니다</p>
          <p style={{ fontSize: 15, color: 'var(--label-3)' }}>새 공지가 등록되면 여기에 표시됩니다</p>
        </div>
      ) : (
        <div style={{ margin: '0 16px', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-2)' }}>
          {notices.map((notice, i) => (
            <a
              key={notice.id}
              href={`/notice/${notice.id}`}
              style={{ display: 'block', padding: '14px 16px', textDecoration: 'none', color: 'inherit', position: 'relative' }}
            >
              {i > 0 && (
                <div style={{ position: 'absolute', top: 0, left: 16, right: 0, height: 1, background: 'var(--sep)' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5, flexWrap: 'wrap' as const }}>
                    {notice.is_pinned && (
                      <span style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 100, fontWeight: 600,
                        background: 'rgba(10,132,255,.15)', color: 'var(--blue)',
                      }}>고정</span>
                    )}
                    <span
                      className={`badge-${notice.category}`}
                      style={{ fontSize: 11, padding: '2px 7px', borderRadius: 100, fontWeight: 600 }}
                    >
                      {CATEGORY_LABEL[notice.category]}
                    </span>
                  </div>
                  <h2 style={{
                    fontSize: 17, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.35,
                    marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>
                    {notice.title}
                  </h2>
                  <p style={{
                    fontSize: 15, color: 'var(--label-2)',
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
                  }}>
                    {stripMd(notice.content)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0, paddingTop: 2 }}>
                  <span style={{ fontSize: 12, color: 'var(--label-3)', whiteSpace: 'nowrap' as const }}>{formatDate(notice.created_at)}</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 14, height: 14, color: 'var(--label-3)' }}>
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
    </PassphraseGate>
  )
}
