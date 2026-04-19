import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { loadFileNoticeById } from '@/lib/fileNotices'
import type { Notice } from '@/lib/supabase'
import NoticeDetail from './NoticeDetail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

async function getNotice(id: string): Promise<Notice | null> {
  const decoded = decodeURIComponent(id)
  if (decoded.startsWith('file-')) return loadFileNoticeById(decoded)
  const { data } = await getSupabase().from('notices').select('*').eq('id', id).single()
  return data ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const notice = await getNotice(id)
  if (!notice) return { title: '공지를 찾을 수 없음' }
  const preview = notice.content.slice(0, 80) + (notice.content.length > 80 ? '...' : '')
  return {
    title: notice.title,
    description: preview,
    openGraph: { title: `🏯 ${notice.title}`, description: preview, type: 'article' },
  }
}

export default async function NoticePage({ params }: Props) {
  const { id } = await params
  const notice = await getNotice(id)
  if (!notice) notFound()
  return <NoticeDetail notice={notice} />
}
