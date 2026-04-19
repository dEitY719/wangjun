-- Supabase에서 실행할 SQL
-- Table Editor > SQL Editor 에서 복붙 후 실행

create table notices (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('notice', 'urgent', 'general', 'strategy')),
  -- strategy 추가 시: ALTER TABLE notices DROP CONSTRAINT notices_category_check;
  -- ALTER TABLE notices ADD CONSTRAINT notices_category_check CHECK (category IN ('notice','urgent','general','strategy'));
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- 카카오톡 메신저용 별도 텍스트 (선택 컬럼)
-- 이미 테이블이 있다면: ALTER TABLE notices ADD COLUMN kakao_content TEXT;
-- kakao_content text,

-- ── members 테이블 (운영진 계정 관리) ──
-- Supabase SQL Editor에서 아래 실행:
-- create table members (
--   id text primary key,
--   pin text not null,
--   display_name text,
--   status text not null default 'pending' check (status in ('pending','approved','rejected')),
--   requested_at timestamptz not null default now(),
--   approved_at timestamptz
-- );
-- alter table members enable row level security;
-- create policy "Service all" on members for all using (true);

-- ── settings 테이블 (암구호 등 설정값) ──
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table settings enable row level security;
create policy "Service all" on settings for all using (true);
-- 초기 암구호 설정 (원하는 값으로 변경하세요)
insert into settings (key, value) values ('passphrase', '왕전');

-- 최신 공지가 먼저 나오도록 인덱스
create index on notices (created_at desc);

-- 공개 읽기 허용 (로그인 없이 조회 가능)
alter table notices enable row level security;

create policy "Public read" on notices
  for select using (true);

create policy "Service insert" on notices
  for insert with check (true);

create policy "Service update" on notices
  for update using (true);

create policy "Service delete" on notices
  for delete using (true);
