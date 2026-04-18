-- Supabase에서 실행할 SQL
-- Table Editor > SQL Editor 에서 복붙 후 실행

create table notices (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  category text not null default 'general' check (category in ('notice', 'urgent', 'general')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

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
