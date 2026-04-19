'use client'

import { useState } from 'react'
import { useMemberAuth } from '@/app/hooks/useMemberAuth'
import { useRouter } from 'next/navigation'

type View = 'info' | 'login' | 'register' | 'pending' | 'rejected'

export default function MemberLoginModal({ onClose }: { onClose: () => void }) {
  const { login, session, logout } = useMemberAuth()
  const router = useRouter()

  const [view, setView] = useState<View>('info')
  const [id, setId]           = useState('')
  const [pin, setPin]         = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const reset = () => { setId(''); setPin(''); setConfirmPin(''); setDisplayName(''); setError('') }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/members/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id.trim(), pin }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error || '로그인 실패'); return }

    if (data.status === 'approved') {
      login({ id: id.trim(), pin, displayName: data.displayName })
      onClose()
      router.push('/write')
    } else if (data.status === 'pending') {
      setView('pending')
    } else {
      setView('rejected')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin !== confirmPin) { setError('PIN이 일치하지 않습니다'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN은 숫자 4자리여야 합니다'); return }
    setLoading(true); setError('')
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id.trim(), pin, display_name: displayName.trim() }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '신청 실패'); return }
    setView('pending')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10, border: 'none',
    background: 'var(--bg-3)', color: 'var(--label)', fontSize: 16,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {/* 배경 */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />

      {/* 시트 */}
      <div style={{
        position: 'relative', background: 'var(--bg-2)', borderRadius: '20px 20px 0 0',
        padding: '20px 20px 40px', maxHeight: '85vh', overflowY: 'auto',
      }}>
        {/* 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--fill-3)', margin: '0 auto 20px' }} />

        {/* ── 로그인 되어있는 경우 ── */}
        {session && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
              {session.displayName || session.id} 님
            </p>
            <p style={{ fontSize: 14, color: 'var(--label-3)', marginBottom: 24 }}>운영진으로 로그인 중입니다</p>
            <button onClick={() => { router.push('/write'); onClose() }} className="btn-primary" style={{ marginBottom: 12 }}>
              공지 작성하기
            </button>
            <button onClick={() => { logout(); onClose() }}
              style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'var(--fill-3)', color: 'var(--label-2)', fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' }}>
              로그아웃
            </button>
          </div>
        )}

        {/* ── 안내 ── */}
        {!session && view === 'info' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>운영진이신가요?</h2>
            <p style={{ fontSize: 15, color: 'var(--label-2)', lineHeight: 1.6, marginBottom: 6 }}>
              보통은 <strong>가입 없이 공지만</strong> 확인하세요.
            </p>
            <p style={{ fontSize: 14, color: 'var(--label-3)', lineHeight: 1.6, marginBottom: 28 }}>
              맹주·부맹주이신 경우, 관리자 승인 후<br />공지 작성 권한이 부여됩니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { reset(); setView('login') }}
                style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'rgba(10,132,255,0.15)', color: 'var(--blue)', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                로그인
              </button>
              <button onClick={() => { reset(); setView('register') }}
                className="btn-primary" style={{ flex: 1 }}>
                신규 신청
              </button>
            </div>
          </div>
        )}

        {/* ── 로그인 ── */}
        {!session && view === 'login' && (
          <div>
            <button onClick={() => setView('info')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 15, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>← 뒤로</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>운영진 로그인</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inputStyle} placeholder="ID" value={id} onChange={e => setId(e.target.value)} autoCapitalize="none" />
              <input style={inputStyle} placeholder="PIN (숫자 4자리)" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} />
              {error && <p style={{ fontSize: 14, color: 'var(--red)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
                {loading ? '확인 중...' : '로그인'}
              </button>
              <button type="button" onClick={() => { reset(); setView('register') }}
                style={{ background: 'none', border: 'none', color: 'var(--label-3)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', paddingTop: 4 }}>
                계정이 없으신가요? 신규 신청
              </button>
            </form>
          </div>
        )}

        {/* ── 신규 신청 ── */}
        {!session && view === 'register' && (
          <div>
            <button onClick={() => setView('info')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 15, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: 'inherit' }}>← 뒤로</button>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>운영진 신청</h2>
            <p style={{ fontSize: 13, color: 'var(--label-3)', marginBottom: 20, lineHeight: 1.5 }}>
              관리자 승인 후 공지 작성이 가능합니다.<br />
              PIN을 잊어버린 경우 관리자가 계정을 삭제하고 다시 신청하세요.
            </p>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input style={inputStyle} placeholder="ID (2~20자)" value={id} onChange={e => setId(e.target.value)} autoCapitalize="none" />
              <input style={inputStyle} placeholder="표시 이름 (선택)" value={displayName} onChange={e => setDisplayName(e.target.value)} />
              <input style={inputStyle} placeholder="PIN (숫자 4자리)" type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => setPin(e.target.value)} />
              <input style={inputStyle} placeholder="PIN 확인" type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} />
              {error && <p style={{ fontSize: 14, color: 'var(--red)' }}>{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
                {loading ? '신청 중...' : '승인 요청'}
              </button>
            </form>
          </div>
        )}

        {/* ── 승인 대기 ── */}
        {!session && view === 'pending' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>⏳</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>승인 대기 중</h2>
            <p style={{ fontSize: 14, color: 'var(--label-2)', lineHeight: 1.6, marginBottom: 24 }}>
              관리자 승인 후 로그인할 수 있습니다.<br />
              승인되면 다시 로그인해주세요.
            </p>
            <button onClick={onClose} className="btn-primary">확인</button>
          </div>
        )}

        {/* ── 거절됨 ── */}
        {!session && view === 'rejected' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🚫</p>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>접근 거절됨</h2>
            <p style={{ fontSize: 14, color: 'var(--label-2)', lineHeight: 1.6, marginBottom: 24 }}>
              관리자에게 문의하세요.
            </p>
            <button onClick={onClose} className="btn-primary">확인</button>
          </div>
        )}
      </div>
    </div>
  )
}
