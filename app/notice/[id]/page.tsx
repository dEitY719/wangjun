import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import NoticeDetail from './NoticeDetail'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getSupabase().from('notices').select('*').eq('id', id).single()

  if (!data) return { title: '공지를 찾을 수 없음' }

  const preview = data.content.slice(0, 80) + (data.content.length > 80 ? '...' : '')

  return {
    title: data.title,
    description: preview,
    openGraph: {
      title: `🏯 ${data.title}`,
      description: preview,
      type: 'article',
    },
  }
}

export default async function NoticePage({ params }: Props) {
  const { id } = await params
  const { data } = await getSupabase().from('notices').select('*').eq('id', id).single()

  if (!data) notFound()

  return <NoticeDetail notice={data} />
}
