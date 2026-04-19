# Vercel — 호스팅 & 배포

## 역할

Next.js 앱을 GitHub과 연동해 자동으로 빌드·배포하는 호스팅 플랫폼.
`main` 브랜치에 push하면 즉시 프로덕션에 반영된다.

## 주요 설정

### 프로젝트 연결
- GitHub 계정(deity719)으로 로그인
- `wangjun` 레포지토리를 Vercel 프로젝트로 import
- 빌드 명령: `next build` (자동 감지)
- 출력 디렉토리: `.next` (자동 감지)

### 환경 변수

| 변수명 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 공개키 |
| `ADMIN_PASSWORD` | `/admin` 페이지 접근 비밀번호 |

> Supabase Settings > API 탭에서 URL과 키를 복사해 입력한다.

### 배포 흐름

```
git push → GitHub → Vercel 자동 빌드 → 프로덕션 URL 갱신
```

## 주의사항

- 로컬에서는 `NODE_ENV=development`가 기본값이므로 빌드 테스트 시 `NODE_ENV=production npm run build` 필요
- Vercel에서는 자동으로 `production` 환경으로 처리됨

## 접속 URL 구조

| 경로 | 설명 |
|---|---|
| `/` | 공지 목록 |
| `/notice/:id` | 공지 상세 및 공유 URL |
| `/admin` | 공지 작성 (비밀번호 필요) |
| `/alliance` | 동맹 정보 |
| `/info` | 성·부대 정보 |
