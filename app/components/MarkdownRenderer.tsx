import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

function CoordBadge({ name, x, y }: { name: string; x: string; y: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 9px 2px 5px',
      borderRadius: 8,
      background: 'rgba(10,132,255,0.15)',
      color: 'var(--blue)',
      fontWeight: 600,
      fontSize: '0.88em',
      verticalAlign: 'middle',
      whiteSpace: 'nowrap',
    }}>
      📍 {name}
      <span style={{ fontSize: '0.82em', opacity: 0.65, fontWeight: 400 }}>
        ({x}, {y})
      </span>
    </span>
  )
}

function CoordMissingBadge({ name }: { name: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 9px 2px 5px', borderRadius: 8,
      background: 'rgba(255,159,10,0.15)', color: 'var(--orange)',
      fontWeight: 600, fontSize: '0.88em', verticalAlign: 'middle', whiteSpace: 'nowrap',
    }}>
      📍 {name}
      <span style={{ fontSize: '0.82em', opacity: 0.65, fontWeight: 400 }}>전체지도에서 검색🔎</span>
    </span>
  )
}

const components: Components = {
  a({ href, children }) {
    const m = href?.match(/^(\d+),(\d+)$/)
    if (m) return <CoordBadge name={String(children)} x={m[1]} y={m[2]} />
    // 좌표 미입력 마커: 숫자 패턴도 아니고 외부 URL도 아닌 경우
    if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
      return <CoordMissingBadge name={String(children)} />
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
        {children}
      </a>
    )
  },
}

export default function MarkdownRenderer({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )
}
