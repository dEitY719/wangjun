'use client'

import { useState, useEffect } from 'react'
import { useMemberAuth } from '@/app/hooks/useMemberAuth'

const SESSION_KEY = 'passphrase_ok'

export function usePassphraseVerified() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem(SESSION_KEY) === 'true'
    setVerified(ok)
  }, [])

  const markVerified = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setVerified(true)
  }

  return { verified, markVerified }
}

export default function PassphraseGate({ children }: { children: React.ReactNode }) {
  const { verified, markVerified } = usePassphraseVerified()
  const { session, ready: memberReady } = useMemberAuth()
  const [input, setInput]   = useState('')
  const [error, setError]   = useState(false)
  const [loading, setLoading] = useState(false)

  // sessionStorage 또는 member 세션 확인 전 대기
  if (verified === null || !memberReady) return null

  // 회원 로그인 상태거나 암구호 인증됐으면 통과
  if (verified || session) return <>{children}</>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true); setError(false)
    const res = await fetch('/api/passphrase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: input }),
    })
    setLoading(false)
    if (res.ok) {
      markVerified()
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 32px',
    }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🔐</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' }}>
        암구호를 입력하세요
      </h1>
      <p style={{ fontSize: 15, color: 'var(--label-3)', marginBottom: 28, textAlign: 'center' }}>
        연합 공지는 인증된 맹원만 열람할 수 있습니다
      </p>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="암구호 입력"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false) }}
          autoFocus
          autoComplete="off"
          style={{
            padding: '14px 16px', borderRadius: 12, border: 'none',
            background: error ? 'rgba(255,69,58,0.12)' : 'var(--bg-2)',
            color: 'var(--label)', fontSize: 17, outline: 'none',
            fontFamily: 'inherit', textAlign: 'center', letterSpacing: 2,
            transition: 'background .2s',
          }}
        />
        {error && (
          <p style={{ fontSize: 14, color: 'var(--red)', textAlign: 'center', margin: '-4px 0' }}>
            암구호가 틀렸습니다
          </p>
        )}
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary" style={{ padding: '14px', fontSize: 17 }}>
          {loading ? '확인 중...' : '입장'}
        </button>
      </form>
    </div>
  )
}
