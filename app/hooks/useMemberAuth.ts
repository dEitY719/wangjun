'use client'

import { useState } from 'react'

export type MemberSession = {
  id: string
  pin: string
  displayName: string | null
}

const KEY = 'member_session'

function readSession(): MemberSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function useMemberAuth() {
  const [session, setSession] = useState<MemberSession | null>(readSession)
  const [ready] = useState(true)

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
