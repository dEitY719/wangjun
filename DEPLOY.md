# 배포 가이드

## 1. Supabase 설정

1. https://supabase.com 접속 → 무료 계정 생성
2. "New Project" 클릭 → 프로젝트 이름 입력 → 지역: Northeast Asia (Tokyo)
3. 프로젝트 생성 후 **SQL Editor** 탭 클릭
4. `lib/supabase.sql` 파일 내용을 붙여넣고 실행
5. **Settings > API** 탭에서:
   - `Project URL` 복사
   - `anon public` 키 복사

## 2. Vercel 배포

1. https://vercel.com 접속 → GitHub으로 로그인
2. "Add New Project" → GitHub 레포지토리 선택
3. **Environment Variables** 섹션에서 추가:
   ```
   NEXT_PUBLIC_SUPABASE_URL     = (Supabase Project URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (Supabase anon key)
   ADMIN_PASSWORD               = (원하는 비밀번호)
   ```
4. "Deploy" 클릭

## 3. 사용법

- **공지 작성**: `https://your-domain.vercel.app/admin`
- **공지 목록**: `https://your-domain.vercel.app/`
- **공지 상세 + 공유 URL**: `https://your-domain.vercel.app/notice/1`

## 로컬 개발

```bash
# .env.local 파일에 환경변수 입력 후
npm run dev

# 빌드 테스트 (로컬)
NODE_ENV=production npm run build
```

> 주의: 이 환경에서는 NODE_ENV=development가 시스템에 설정되어 있어
> 빌드 시 `NODE_ENV=production` 접두사가 필요합니다.
> Vercel에서는 자동으로 production으로 처리됩니다.
