# 왕준 — 게임 길드 운영 웹앱

Next.js 15 + Supabase 기반의 길드 공지·지도 관리 서비스.

## 주요 기능

| 경로 | 설명 |
|---|---|
| `/` | 공지 목록 |
| `/notice/:id` | 공지 상세 및 공유 URL |
| `/admin` | 공지 작성·관리 (비밀번호 필요) |
| `/alliance` | 동맹 정보 |
| `/info` | 성·부대 정보 |

## 인프라

| 서비스 | 역할 |
|---|---|
| [Vercel](https://vercel.com) | Next.js 호스팅, GitHub 연동 자동 배포 |
| [Supabase](https://supabase.com) | PostgreSQL 데이터베이스 (공지, 지도 데이터) |

자세한 설정 내용: [Vercel 설정](docs/readme/vercel.md) · [Supabase 설정](docs/readme/supabase.md)

## 로컬 개발

```bash
# 1. 환경변수 설정 (.env.local 파일 직접 생성)
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_PASSWORD 입력

# 2. 의존성 설치 및 실행
npm install
npm run dev
```

## 배포

`main` 브랜치에 push하면 Vercel에서 자동 빌드·배포된다.
초기 배포 절차: [DEPLOY.md](DEPLOY.md)
