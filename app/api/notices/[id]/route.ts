import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { checkAdminAuth, checkAnyWriteAuth } from '@/lib/auth'
import { loadFileNoticeById } from '@/lib/fileNotices'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id.startsWith('file-')) {
    const notice = loadFileNoticeById(id)
    if (!notice) return NextResponse.json({ error: '공지를 찾을 수 없습니다' }, { status: 404 })
    return NextResponse.json(notice)
  }

  const { data, error } = await getSupabase()
    .from('notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: '공지를 찾을 수 없습니다' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await checkAnyWriteAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const body = await req.json()
  const { title, content, category, is_pinned } = body

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '제목과 내용을 입력하세요' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('notices')
    .update({ title, content, category, is_pinned: is_pinned || false })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패 (관리자 전용)' }, { status: 401 })
  }

  const { error } = await getSupabase().from('notices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
