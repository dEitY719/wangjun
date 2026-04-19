'use client'

import { useState, useEffect } from 'react'

export type MemberSession = {
  id: string
  pin: string
  displayName: string | null
}

const KEY = 'member_session'

export function useMemberAuth() {
  const [session, setSession] = useState<MemberSession | null>(null)
  const [ready, setReady]     = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY)
      if (raw) setSession(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  const login = (s: MemberSession) => {
    sessionStorage.setItem(KEY, JSON.stringify(s))
    setSession(s)
  }

  const logout = () => {
    sessionStorage.removeItem(KEY)
    setSession(null)
  }

  const authHeaders: Record<string, string> = session
    ? { 'x-member-id': session.id, 'x-member-pin': session.pin }
    : {}

  return { session, ready, login, logout, authHeaders }
}
