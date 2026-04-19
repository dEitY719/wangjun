import { getSupabase } from './supabase'

export async function checkAdminAuth(req: Request): Promise<boolean> {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

export async function checkMemberAuth(req: Request): Promise<boolean> {
  const id  = req.headers.get('x-member-id')
  const pin = req.headers.get('x-member-pin')
  if (!id || !pin) return false

  const { data } = await getSupabase()
    .from('members')
    .select('status')
    .eq('id', id)
    .eq('pin', pin)
    .single()

  return data?.status === 'approved'
}

export async function checkAnyWriteAuth(req: Request): Promise<boolean> {
  return (await checkAdminAuth(req)) || (await checkMemberAuth(req))
}
