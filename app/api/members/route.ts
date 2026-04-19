import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'

// 관리자: 전체 멤버 목록 조회
export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }

  const { data, error } = await getSupabase()
    .from('members')
    .select('id, display_name, status, requested_at, approved_at')
    .order('requested_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// 신규 가입 신청 (공개)
export async function POST(req: NextRequest) {
  const { id, pin, display_name } = await req.json()

  if (!id?.trim() || !pin?.trim()) {
    return NextResponse.json({ error: 'ID와 PIN을 입력하세요' }, { status: 400 })
  }
  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN은 숫자 4자리여야 합니다' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9가-힣_-]{2,20}$/.test(id)) {
    return NextResponse.json({ error: 'ID는 2~20자의 영문/숫자/한글이어야 합니다' }, { status: 400 })
  }

  const supabase = getSupabase()

  // 중복 ID 체크
  const { data: existing } = await supabase
    .from('members')
    .select('id')
    .eq('id', id)
    .single()

  if (existing) {
    return NextResponse.json({ error: '이미 사용 중인 ID입니다' }, { status: 409 })
  }

  const { error } = await supabase
    .from('members')
    .insert({ id, pin, display_name: display_name?.trim() || null, status: 'pending' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
