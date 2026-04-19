import fs from 'fs'
import path from 'path'
import type { Notice } from './supabase'

const NOTICES_DIR = path.join(process.cwd(), 'notices')

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw.trim() }
  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const i = line.indexOf(':')
    if (i < 0) continue
    meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1')
  }
  return { meta, body: match[2].trim() }
}

export function loadFileNotices(): Notice[] {
  if (!fs.existsSync(NOTICES_DIR)) return []
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md'))
  const result: Notice[] = []

  for (const file of files) {
    const raw = fs.readFileSync(path.join(NOTICES_DIR, file), 'utf-8')
    const { meta, body } = parseFrontmatter(raw)
    if (meta.publish !== 'true') continue

    const name = file.replace(/\.md$/, '')
    const date = meta.date || new Date().toISOString().slice(0, 10)
    const time = meta.time || '00:00'
    const created_at = new Date(`${date}T${time}:00+09:00`).toISOString()

    result.push({
      id: `file-${name}`,
      title: meta.title || name,
      content: body,
      category: (meta.category as Notice['category']) || 'general',
      is_pinned: meta.is_pinned === 'true',
      created_at,
    })
  }

  return result.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function loadFileNoticeById(id: string): Notice | null {
  const name = id.replace(/^file-/, '')
  const filepath = path.join(NOTICES_DIR, `${name}.md`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf-8')
  const { meta, body } = parseFrontmatter(raw)
  if (meta.publish !== 'true') return null

  const date = meta.date || new Date().toISOString().slice(0, 10)
  const time = meta.time || '00:00'
  const created_at = new Date(`${date}T${time}:00+09:00`).toISOString()

  return {
    id: `file-${name}`,
    title: meta.title || name,
    content: body,
    category: (meta.category as Notice['category']) || 'general',
    is_pinned: meta.is_pinned === 'true',
    created_at,
  }
}
