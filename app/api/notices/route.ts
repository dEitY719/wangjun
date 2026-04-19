import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { checkAnyWriteAuth } from '@/lib/auth'
import { loadFileNotices } from '@/lib/fileNotices'

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fileNotices = loadFileNotices()
  const all = [...(data ?? []), ...fileNotices]
    .sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
      return b.created_at.localeCompare(a.created_at)
    })

  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  if (!(await checkAnyWriteAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const body = await req.json()
  const { title, content, category, is_pinned } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력하세요' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('notices')
    .insert({ title, content, category: category || 'general', is_pinned: is_pinned || false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
