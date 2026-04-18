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
    <div>
      <Link href="/" className="inline-flex items-center gap-1 text-sm mb-5 transition-colors"
        style={{ color: 'var(--text-muted)' }}>
        ← 목록으로
      </Link>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {notice.is_pinned && (
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              📌 고정
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded-full font-semibold badge-${notice.category}`}>
            {CATEGORY_LABEL[notice.category]}
          </span>
        </div>

        <h1 className="text-xl font-bold leading-snug mb-2">{notice.title}</h1>

        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          {formatDate(notice.created_at)}
        </p>

        <hr style={{ borderColor: 'var(--border)' }} className="mb-5" />

        <div className="notice-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notice.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={copyUrl}
          className="w-full btn-primary text-center py-3 text-sm"
        >
          🔗 URL 복사 (카카오톡 공유용)
        </button>
      </div>
    </div>
  )
}
