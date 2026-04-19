#!/usr/bin/env node
/**
 * VSCode에서 작성한 마크다운 공지 파일을 Supabase에 업로드합니다.
 *
 * 사용법:
 *   npm run notice:upload notices/attack.md
 *   npm run notice:upload notices/attack.md -- --category urgent --pinned
 *   npm run notice:upload notices/attack.md -- --dry-run
 *
 * 파일 형식 (YAML 프론트매터 + 마크다운):
 *   ---
 *   title: 낙양 공격 공지
 *   category: urgent        # urgent | notice | general  (기본값: notice)
 *   is_pinned: false        # true | false  (기본값: false)
 *   ---
 *
 *   ## 공지 내용
 *   [낙양](1247,873) 주변으로 집결하세요.
 *
 * 환경 변수 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── .env.local 로드 ──────────────────────────────────────────────────────────
function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf-8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  } catch { /* .env.local 없으면 기존 환경 변수 사용 */ }
}

// ── YAML 프론트매터 파서 ─────────────────────────────────────────────────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: raw.trim() }

  const meta = {}
  for (const line of m[1].split('\n')) {
    const sep = line.indexOf(':')
    if (sep < 0) continue
    const key = line.slice(0, sep).trim()
    const val = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '')
    meta[key] = val === 'true' ? true : val === 'false' ? false : val
  }
  return { meta, body: m[2].trim() }
}

// ── CLI 인자 파서 ────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = { file: null, title: null, category: null, pinned: false, dryRun: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--title')    { args.title    = argv[++i]; continue }
    if (argv[i] === '--category') { args.category = argv[++i]; continue }
    if (argv[i] === '--pinned')   { args.pinned   = true;      continue }
    if (argv[i] === '--dry-run')  { args.dryRun   = true;      continue }
    if (!argv[i].startsWith('--')) args.file = argv[i]
  }
  return args
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  loadEnvLocal()

  const args = parseArgs(process.argv.slice(2))

  if (!args.file) {
    console.error([
      '',
      '  사용법: npm run notice:upload <파일.md> [-- 옵션]',
      '',
      '  옵션:',
      '    --title <제목>              프론트매터 title 덮어쓰기',
      '    --category urgent|notice|general  카테고리 지정 (기본: notice)',
      '    --pinned                    공지 상단 고정',
      '    --dry-run                   업로드 없이 파싱 결과만 출력',
      '',
    ].join('\n'))
    process.exit(1)
  }

  const raw = readFileSync(resolve(args.file), 'utf-8')
  const { meta, body } = parseFrontmatter(raw)

  const title    = args.title    ?? meta.title    ?? null
  const category = args.category ?? meta.category ?? 'notice'
  const isPinned = args.pinned   || meta.is_pinned || false

  const VALID_CATEGORIES = ['urgent', 'notice', 'general']
  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`카테고리 오류: "${category}" — urgent | notice | general 중 하나여야 합니다.`)
    process.exit(1)
  }

  if (!title) {
    console.error('제목이 없습니다. 프론트매터에 "title: ..." 을 추가하거나 --title 옵션을 사용하세요.')
    process.exit(1)
  }

  if (!body) {
    console.error('공지 본문이 비어 있습니다.')
    process.exit(1)
  }

  const CAT_LABEL = { urgent: '🚨 긴급', notice: '📢 공지', general: '💬 일반' }
  console.log('')
  console.log('─'.repeat(50))
  console.log(`  파일      : ${args.file}`)
  console.log(`  제목      : ${title}`)
  console.log(`  카테고리  : ${CAT_LABEL[category]}`)
  console.log(`  고정      : ${isPinned ? '예' : '아니오'}`)
  console.log(`  본문 길이 : ${body.length}자 / ${body.split('\n').length}줄`)
  console.log('─'.repeat(50))

  if (args.dryRun) {
    console.log('\n[dry-run] 업로드를 건너뜁니다. 본문 미리보기:\n')
    console.log(body.slice(0, 500) + (body.length > 500 ? '\n...(이하 생략)' : ''))
    console.log('')
    return
  }

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !svcKey) {
    console.error('\n.env.local 파일에 다음 환경 변수가 필요합니다:')
    console.error('  NEXT_PUBLIC_SUPABASE_URL')
    console.error('  SUPABASE_SERVICE_ROLE_KEY\n')
    process.exit(1)
  }

  const supabase = createClient(url, svcKey)

  const { data, error } = await supabase
    .from('notices')
    .insert({ title, content: body, category, is_pinned: isPinned })
    .select('id, title, created_at')
    .single()

  if (error) {
    console.error('\n업로드 실패:', error.message, '\n')
    process.exit(1)
  }

  console.log(`\n  ✓ 업로드 완료!`)
  console.log(`    ID    : ${data.id}`)
  console.log(`    제목  : ${data.title}`)
  console.log(`    시각  : ${new Date(data.created_at).toLocaleString('ko-KR')}`)
  console.log('')
}

main().catch((e) => { console.error('\n오류:', e.message, '\n'); process.exit(1) })
