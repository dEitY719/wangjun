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

const components: Components = {
  a({ href, children }) {
    const m = href?.match(/^(\d+),(\d+)$/)
    if (m) return <CoordBadge name={String(children)} x={m[1]} y={m[2]} />
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
