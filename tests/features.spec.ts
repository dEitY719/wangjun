import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3099'
const ADMIN_PW = '!love03117291'

// 멤버 세션 주입 (write 페이지 리다이렉트 우회용)
async function injectMemberSession(page: import('@playwright/test').Page) {
  // 페이지 로드 전에 initScript로 sessionStorage 세팅 → 리다이렉트 경쟁 조건 방지
  await page.addInitScript(() => {
    sessionStorage.setItem('member_session', JSON.stringify({ id: 'test', pin: '0000', displayName: '테스터' }))
  })
}

// ──────────────────────────────────────────
// 1. Templates API
// ──────────────────────────────────────────
test('GET /api/templates 는 템플릿 목록을 반환', async ({ request }) => {
  const res = await request.get(`${BASE}/api/templates`)
  expect(res.status()).toBe(200)
  const data = await res.json()
  expect(Array.isArray(data)).toBe(true)
  const names = data.map((t: { name: string }) => t.name)
  expect(names).toContain('북진경로')
  expect(names).toContain('공성집결')
})

test('POST /api/templates - 관리자 인증으로 템플릿 저장', async ({ request }) => {
  const res = await request.post(`${BASE}/api/templates`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PW },
    data: { name: 'playwright-test', title: '⚔️ 전략', category: 'strategy', time: '21:00', body: '테스트 내용입니다.' },
  })
  expect(res.status()).toBe(200)
  const json = await res.json()
  expect(json.ok).toBe(true)
})

test('GET /api/templates - 저장한 템플릿이 목록에 포함', async ({ request }) => {
  const res = await request.get(`${BASE}/api/templates`)
  const data = await res.json()
  const found = data.find((t: { name: string; body: string }) => t.name === 'playwright-test')
  expect(found).toBeTruthy()
  expect(found.body).toContain('테스트 내용')
})

test('DELETE /api/templates - 관리자 인증으로 템플릿 삭제', async ({ request }) => {
  const res = await request.delete(`${BASE}/api/templates`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PW },
    data: { name: 'playwright-test' },
  })
  expect(res.status()).toBe(200)
})

test('GET /api/templates - 삭제 후 목록에서 제거됨', async ({ request }) => {
  const res = await request.get(`${BASE}/api/templates`)
  const data = await res.json()
  const found = data.find((t: { name: string }) => t.name === 'playwright-test')
  expect(found).toBeFalsy()
})

test('POST /api/templates - 인증 없으면 401', async ({ request }) => {
  const res = await request.post(`${BASE}/api/templates`, {
    headers: { 'Content-Type': 'application/json' },
    data: { name: 'noauth', title: '테스트', category: 'general', time: '', body: '내용' },
  })
  expect(res.status()).toBe(401)
})

// ──────────────────────────────────────────
// 2. Write 페이지 - 템플릿 UI
// ──────────────────────────────────────────
test('Write 페이지 - 📋 템플릿 버튼 표시', async ({ page }) => {
  await injectMemberSession(page)
  await page.goto(`${BASE}/write`)
  await expect(page.getByRole('button', { name: /템플릿/ })).toBeVisible()
})

test('Write 페이지 - 템플릿 버튼 클릭 시 목록 표시', async ({ page }) => {
  await injectMemberSession(page)
  await page.goto(`${BASE}/write`)
  await page.getByRole('button', { name: /템플릿/ }).click()
  await expect(page.getByText('북진경로')).toBeVisible()
  await expect(page.getByText('공성집결')).toBeVisible()
})

test('Write 페이지 - 북진경로 불러오기 → 카테고리·메모 채워짐', async ({ page }) => {
  await injectMemberSession(page)
  await page.goto(`${BASE}/write`)
  await page.getByRole('button', { name: /템플릿/ }).click()
  // 북진경로 행의 불러오기 버튼
  const row = page.locator('div').filter({ hasText: /^북진경로/ }).first()
  await row.getByRole('button', { name: '불러오기' }).click()
  // 패널이 닫히고 텍스트에리어에 내용이 채워짐
  const textarea = page.locator('textarea')
  await expect(textarea).toHaveValue(/북진/)
  // 미리보기로 확인
  await page.getByRole('button', { name: '미리보기' }).click()
  await expect(page.locator('.notice-content')).toContainText('북진')
})

test('Write 페이지 - 현재 메모 저장 플로우', async ({ page }) => {
  await injectMemberSession(page)
  await page.goto(`${BASE}/write`)
  // 메모 입력
  await page.locator('textarea').fill('플레이라이트 저장 테스트')
  // 템플릿 패널 열기
  await page.getByRole('button', { name: /템플릿/ }).click()
  // 저장 버튼 클릭
  await page.getByRole('button', { name: /현재 메모를 템플릿으로 저장/ }).click()
  // 이름 입력
  await page.getByPlaceholder('템플릿 이름').fill('pw-save-test')
  // 저장 (admin pw 없으므로 실패 → 저장 실패 메시지 확인)
  await page.getByRole('button', { name: '저장' }).click()
  await expect(page.getByText(/저장 실패/)).toBeVisible()
})

// ──────────────────────────────────────────
// 3. 좌표 미입력 뱃지 텍스트
// ──────────────────────────────────────────
test('공지 상세 - map-search 링크는 "전체지도에서 검색" 뱃지로 렌더링', async ({ page, request }) => {
  // 테스트용 공지 생성
  const res = await request.post(`${BASE}/api/notices`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PW },
    data: { title: '좌표테스트', content: '[낙양](map-search) 진출', category: 'general', is_pinned: false },
  })
  expect(res.status()).toBe(201)
  const notice = await res.json()

  await page.goto(`${BASE}/notice/${notice.id}`)
  await expect(page.getByText('전체지도에서 검색')).toBeVisible()
  await expect(page.getByText('낙양')).toBeVisible()

  // 테스트 공지 삭제
  await request.delete(`${BASE}/api/notices/${notice.id}`, {
    headers: { 'x-admin-password': ADMIN_PW },
  })
})

// ──────────────────────────────────────────
// 4. 카카오 복사 - 📍 포함 여부
// ──────────────────────────────────────────
test('공지 상세 - 카카오 복사 시 map-search 링크는 📍지역명 형태', async ({ page, request, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  const res = await request.post(`${BASE}/api/notices`, {
    headers: { 'Content-Type': 'application/json', 'x-admin-password': ADMIN_PW },
    data: { title: '카카오복사테스트', content: '[하변](map-search) 공성\n[낙양](100,200) 집결', category: 'general', is_pinned: false },
  })
  expect(res.status()).toBe(201)
  const notice = await res.json()

  await page.goto(`${BASE}/notice/${notice.id}`)
  await page.getByRole('button', { name: /카카오톡 전달 메시지 복사/ }).click()

  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toContain('📍하변')
  expect(copied).toContain('📍낙양(100,200)')
  expect(copied).not.toContain('map-search')

  await request.delete(`${BASE}/api/notices/${notice.id}`, {
    headers: { 'x-admin-password': ADMIN_PW },
  })
})
