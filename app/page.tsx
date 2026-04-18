'use client'

import { useEffect, useState } from 'react'
import type { Notice } from '@/lib/supabase'

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  notice: '공지',
  general: '일반',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Home() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/notices')
      .then((r) => r.json())
      .then((data) => {
        setNotices(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-lg animate-pulse" style={{ color: 'var(--text-muted)' }}>불러오는 중...</div>
      </div>
    )
  }

  if (notices.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
        <div className="text-4xl mb-4">📭</div>
        <p>아직 공지가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <a key={notice.id} href={`/notice/${notice.id}`} className="block card p-4 hover:border-amber-500 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {notice.is_pinned && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                    📌 고정
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold badge-${notice.category}`}>
                  {CATEGORY_LABEL[notice.category]}
                </span>
              </div>
              <h2 className="font-bold text-base leading-snug truncate">{notice.title}</h2>
              <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {notice.content}
              </p>
            </div>
            <div className="text-xs shrink-0 mt-1" style={{ color: 'var(--text-muted)' }}>
              {formatDate(notice.created_at)}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
