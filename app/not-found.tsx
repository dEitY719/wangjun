import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
      <div className="text-4xl mb-4">🔍</div>
      <h2 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h2>
      <Link href="/" className="text-sm underline">홈으로 돌아가기</Link>
    </div>
  )
}
