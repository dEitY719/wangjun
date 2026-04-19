# Supabase — 데이터베이스 백엔드

## 역할

PostgreSQL 기반의 클라우드 데이터베이스.
공지사항, 지도 데이터(성·동맹·진영), 설정값을 저장하며 Row Level Security(RLS)로 접근을 제어한다.

## 프로젝트 설정

- **플랜**: Free tier
- **지역**: Northeast Asia (Tokyo) — 한국 사용자 지연 최소화
- **초기화**: `lib/supabase.sql`을 SQL Editor에서 실행해 테이블 생성

## 테이블 구조

### notices (공지사항)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | bigint | 자동 증가 PK |
| `title` | text | 제목 |
| `content` | text | 본문 (Markdown) |
| `category` | text | `notice` / `urgent` / `general` / `strategy` |
| `is_pinned` | boolean | 상단 고정 여부 |
| `created_at` | timestamptz | 생성 시각 |

### settings (설정값)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `key` | text | PK (예: `passphrase`) |
| `value` | text | 설정값 |
| `updated_at` | timestamptz | 갱신 시각 |

초기값: `passphrase = '왕전'`

### factions (진영)

| id | color_label | color_hex |
|---|---|---|
| 위 | 하늘색 | `#7DD3FC` |
| 촉 | 연두색 | `#86EFAC` |
| 오 | 옅은빨강 | `#FCA5A5` |

### alliances (동맹)

- `abbr` (PK) / `name` / `faction_id`
- 예: `라 → 대한제국 → 촉`, `은 → 은하수 → 오`

### castle_troops (성 부대 정보)

- `level` (PK): `1`~`10`, `시`, `관문` 등
- 수비병력 / 부대수 / 성방어군 / 방어수치

### castles (성 위치)

- `name` (PK) / `level` / `x` / `y` / `alliance_abbr`
- 지도 좌표계 기준 위치

## Row Level Security (RLS)

모든 테이블에 RLS 활성화. 정책:

| 테이블 | 읽기 | 쓰기 |
|---|---|---|
| notices | 공개 (비로그인 가능) | 서비스 키로만 |
| settings | 공개 | 서비스 키로만 |
| factions / alliances / castle_troops / castles | 공개 | 서비스 키로만 |

## 환경 변수 (Vercel / .env.local)

```
NEXT_PUBLIC_SUPABASE_URL      = https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = <anon-public-key>
```

> Supabase 대시보드 **Settings > API** 탭에서 복사

## 스키마 변경 방법

`lib/supabase.sql`을 수정한 뒤 Supabase SQL Editor에서 해당 ALTER/CREATE 구문만 실행한다.
