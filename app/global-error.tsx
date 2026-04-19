'use client'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>오류가 발생했습니다</h2>
          <button onClick={reset} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0a84ff', color: '#fff', cursor: 'pointer' }}>
            다시 시도
          </button>
        </div>
      </body>
    </html>
  )
}
