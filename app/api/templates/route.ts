import { NextRequest, NextResponse } from 'next/server'
import { checkAnyWriteAuth } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const TEMPLATES_DIR = path.join(process.cwd(), 'notices')

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

export async function GET() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md'))
  const templates = files.map(f => {
    const raw = fs.readFileSync(path.join(TEMPLATES_DIR, f), 'utf-8')
    const { meta, body } = parseFrontmatter(raw)
    return {
      name: f.replace(/\.md$/, ''),
      title: meta.title || f.replace(/\.md$/, ''),
      category: meta.category || 'general',
      time: meta.time || '',
      body,
    }
  })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  if (!(await checkAnyWriteAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const { name, title, category, time, body } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: '이름을 입력하세요' }, { status: 400 })

  const filename = `${name.trim()}.md`
  const safe = /^[^/\\<>:"|?*\x00-\x1f]+\.md$/.test(filename)
  if (!safe) return NextResponse.json({ error: '유효하지 않은 파일명' }, { status: 400 })

  const lines = ['---']
  if (title) lines.push(`title: "${title}"`)
  if (category) lines.push(`category: ${category}`)
  if (time) lines.push(`time: "${time}"`)
  lines.push('---', '', body || '')

  fs.writeFileSync(path.join(TEMPLATES_DIR, filename), lines.join('\n'))
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await checkAnyWriteAuth(req))) {
    return NextResponse.json({ error: '인증 실패' }, { status: 401 })
  }
  const { name } = await req.json()
  const filename = `${name}.md`
  const safe = /^[^/\\<>:"|?*\x00-\x1f]+\.md$/.test(filename)
  if (!safe) return NextResponse.json({ error: '유효하지 않은 파일명' }, { status: 400 })

  const filepath = path.join(TEMPLATES_DIR, filename)
  if (!fs.existsSync(filepath)) return NextResponse.json({ error: '없는 템플릿' }, { status: 404 })
  fs.unlinkSync(filepath)
  return NextResponse.json({ ok: true })
}
