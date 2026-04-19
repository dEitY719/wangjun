import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { id, pin } = await req.json()

  if (!id?.trim() || !pin?.trim()) {
    return NextResponse.json({ error: 'ID와 PIN을 입력하세요' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('members')
    .select('id, display_name, status')
    .eq('id', id)
    .eq('pin', pin)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'ID 또는 PIN이 올바르지 않습니다' }, { status: 401 })
  }

  return NextResponse.json({ status: data.status, displayName: data.display_name })
}
