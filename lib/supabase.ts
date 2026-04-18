import { createClient } from '@supabase/supabase-js'

export type Notice = {
  id: number
  title: string
  content: string
  category: 'notice' | 'urgent' | 'general'
  created_at: string
  is_pinned: boolean
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}
