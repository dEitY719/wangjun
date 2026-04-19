import type { Metadata, Viewport } from 'next'
import TabBar from './components/TabBar'
import './globals.css'

export const metadata: Metadata = {
  title: '동맹',
  description: '삼국지 동맹 공지 및 게임 정보',
  openGraph: {
    title: '동맹',
    description: '삼국지 동맹 공지 및 게임 정보',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ minHeight: '100dvh' }}>
        <main style={{
          maxWidth: 640,
          margin: '0 auto',
          paddingBottom: 'calc(57px + env(safe-area-inset-bottom, 0px))',
        }}>
          {children}
        </main>
        <TabBar />
      </body>
    </html>
  )
}
