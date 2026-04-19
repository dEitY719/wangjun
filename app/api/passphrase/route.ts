import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { checkAdminAuth } from '@/lib/auth'

async function getPassphrase(): Promise<string | null> {
  const { data } = await getSupabase()
    .from('settings')
    .select('value')
    .eq('key', 'passphrase')
    .single()
  return data?.value ?? null
}

// 관리자: 현재 암구호 조회
export async function GET(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const value = await getPassphrase()
  return NextResponse.json({ passphrase: value ?? '' })
}

// 일반: 암구호 검증
export async function POST(req: NextRequest) {
  const { passphrase } = await req.json()
  if (!passphrase?.trim()) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const current = await getPassphrase()
  if (current === null) {
    return NextResponse.json({ ok: false, error: '암구호가 설정되지 않았습니다' }, { status: 503 })
  }
  const ok = passphrase.trim() === current.trim()
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 })
}

// 관리자: 암구호 변경
export async function PUT(req: NextRequest) {
  if (!(await checkAdminAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const { passphrase } = await req.json()
  if (!passphrase?.trim()) {
    return NextResponse.json({ error: '암구호를 입력하세요' }, { status: 400 })
  }
  const { error } = await getSupabase()
    .from('settings')
    .upsert({ key: 'passphrase', value: passphrase.trim(), updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
