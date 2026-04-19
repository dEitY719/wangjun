import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { CastleWithDetails, MapData } from '@/lib/supabase'

const UNOCCUPIED_COLOR = '#6B7280'

export async function GET() {
  const supabase = getSupabase()

  const [castlesRes, factionsRes, alliancesRes] = await Promise.all([
    supabase
      .from('castles')
      .select(`
        name, level, x, y, alliance_abbr,
        alliance:alliances (
          abbr, name, faction_id,
          faction:factions ( id, color_label, color_hex )
        ),
        troops:castle_troops ( level, garrison, unit_count, defense_army, defense_rating )
      `)
      .order('name'),
    supabase.from('factions').select('*').order('id'),
    supabase.from('alliances').select('*').order('name'),
  ])

  if (castlesRes.error) return NextResponse.json({ error: castlesRes.error.message }, { status: 500 })
  if (factionsRes.error) return NextResponse.json({ error: factionsRes.error.message }, { status: 500 })
  if (alliancesRes.error) return NextResponse.json({ error: alliancesRes.error.message }, { status: 500 })

  const castles: CastleWithDetails[] = (castlesRes.data ?? []).map((c) => {
    // Supabase returns nested joins as objects (not arrays) for to-one relations
    const alliance = Array.isArray(c.alliance) ? c.alliance[0] : c.alliance
    const faction = alliance
      ? (Array.isArray(alliance.faction) ? alliance.faction[0] : alliance.faction)
      : null
    const troops = Array.isArray(c.troops) ? c.troops[0] : c.troops

    return {
      name: c.name,
      level: c.level,
      x: c.x,
      y: c.y,
      alliance_abbr: c.alliance_abbr,
      alliance: alliance ? { ...alliance, faction } : null,
      troops: troops ?? null,
      color_hex: faction?.color_hex ?? UNOCCUPIED_COLOR,
    }
  })

  const body: MapData = {
    castles,
    factions: factionsRes.data ?? [],
    alliances: alliancesRes.data ?? [],
  }

  return NextResponse.json(body)
}
