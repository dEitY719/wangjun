import { createClient } from '@supabase/supabase-js'

export type Member = {
  id: string
  display_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  approved_at: string | null
}

export type Notice = {
  id: number | string
  title: string
  content: string
  category: 'notice' | 'urgent' | 'general' | 'strategy'
  created_at: string
  is_pinned: boolean
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}
