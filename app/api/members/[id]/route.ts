import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

// 승인 / 거절
export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const { id } = await params
  const { action } = await req.json()  // 'approve' | 'reject'

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: '잘못된 action' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('members')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      approved_at: action === 'approve' ? new Date().toISOString() : null,
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// 멤버 삭제 (권한 박탈 + 계정 제거)
export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const { id } = await params
  const { error } = await getSupabase().from('members').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
