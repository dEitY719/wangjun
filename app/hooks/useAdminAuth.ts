'use client'

import { useState } from 'react'

const SESSION_KEY = 'wj_admin_pw'

export function useAdminAuth() {
  const [password, setPassword] = useState(() =>
    typeof window === 'undefined' ? '' : (sessionStorage.getItem(SESSION_KEY) ?? '')
  )
  const [isAdmin, setIsAdmin] = useState(() =>
    typeof window === 'undefined' ? false : !!sessionStorage.getItem(SESSION_KEY)
  )
  const [ready] = useState(true)

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
