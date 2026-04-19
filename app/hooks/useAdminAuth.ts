'use client'

import { useState, useEffect } from 'react'

const SESSION_KEY = 'wj_admin_pw'

export function useAdminAuth() {
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin]   = useState(false)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY) ?? ''
    if (stored) { setPassword(stored); setIsAdmin(true) }
    setReady(true)
  }, [])

  const saveAuth = (pw: string) => {
    sessionStorage.setItem(SESSION_KEY, pw)
    setPassword(pw)
    setIsAdmin(true)
  }

  const clearAuth = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setPassword('')
    setIsAdmin(false)
  }

  return { password, isAdmin, ready, saveAuth, clearAuth }
}
