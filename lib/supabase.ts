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

export type Faction = {
  id: string
  color_label: string
  color_hex: string
}

export type Alliance = {
  abbr: string
  name: string
  faction_id: string
}

export type CastleTroops = {
  level: string
  garrison: number
  unit_count: number
  defense_army: number
  defense_rating: string
}

export type Castle = {
  name: string
  level: string
  x: number
  y: number
  alliance_abbr: string | null
}

export type CastleWithDetails = Castle & {
  alliance: (Alliance & { faction: Faction | null }) | null
  troops: CastleTroops | null
  color_hex: string
}

export type MapData = {
  castles: CastleWithDetails[]
  factions: Faction[]
  alliances: Alliance[]
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(url, key)
}
