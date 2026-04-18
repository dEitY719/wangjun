import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: '동맹 공지',
  description: '삼국지 동맹 공지 및 게임 정보',
  openGraph: {
    title: '동맹 공지',
    description: '삼국지 동맹 공지 및 게임 정보',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🏯</span>
              <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>동맹 공지</span>
            </Link>
            <nav className="flex gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Link href="/" className="hover:text-white transition-colors">공지</Link>
              <Link href="/admin" className="hover:text-white transition-colors">관리</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
