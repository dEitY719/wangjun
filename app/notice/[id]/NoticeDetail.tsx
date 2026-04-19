'use client'

import Link from 'next/link'
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
  return (
    <div style={{ padding: '0 16px' }}>
      {/* Back navigation */}
      <div style={{ paddingTop: 52, paddingBottom: 16 }}>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 17, color: 'var(--blue)', textDecoration: 'none',
          fontWeight: 400,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          공지
        </Link>
      </div>

      {/* Header */}
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

        <h1 style={{
          fontSize: 28, fontWeight: 700, letterSpacing: -0.5,
          lineHeight: 1.2, marginBottom: 10,
        }}>
          {notice.title}
        </h1>

        <p style={{ fontSize: 14, color: 'var(--label-3)' }}>{formatDate(notice.created_at)}</p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--sep)', marginBottom: 24 }} />

      {/* Content */}
      <div className="notice-content" style={{ marginBottom: 32 }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {notice.content}
        </ReactMarkdown>
      </div>

      {/* Share button */}
      <button onClick={copyUrl} className="btn-primary" style={{ marginBottom: 8 }}>
        URL 복사 (카카오톡 공유용)
      </button>
    </div>
  )
}
