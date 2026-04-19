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

-- ═══════════════════════════════════════════════
-- 지도 기능 테이블
-- ═══════════════════════════════════════════════

-- ── factions (진영색상) ──
create table factions (
  id          text primary key,   -- '위' | '촉' | '오'
  color_label text not null,      -- '하늘색' | '연두색' | '옅은빨강'
  color_hex   text not null       -- CSS hex 색상
);

insert into factions (id, color_label, color_hex) values
  ('위', '하늘색',   '#7DD3FC'),
  ('촉', '연두색',   '#86EFAC'),
  ('오', '옅은빨강', '#FCA5A5');

alter table factions enable row level security;
create policy "Public read" on factions for select using (true);
create policy "Service all"  on factions for all   using (true);


-- ── alliances (동맹정보) ──
create table alliances (
  abbr       text primary key,             -- 호 (단축키): '라', '은', '한' …
  name       text not null,               -- 동맹이름: '대한제국', '은하수' …
  faction_id text not null references factions(id)
);

create index on alliances (faction_id);

insert into alliances (abbr, name, faction_id) values
  ('라',   '대한제국', '촉'),
  ('은',   '은하수',   '오'),
  ('한',   '한국',     '촉'),
  ('향_2', '향단이',   '촉'),
  ('환',   '환단',     '오');

alter table alliances enable row level security;
create policy "Public read" on alliances for select using (true);
create policy "Service all"  on alliances for all   using (true);


-- ── castle_troops (성부대) ──
create table castle_troops (
  level          text    primary key,  -- '1'~'10', '시', '관문' 등
  garrison       integer not null,     -- 주성수비병력
  unit_count     integer not null,     -- 부대수
  defense_army   integer not null,     -- 성방어군
  defense_rating text    not null      -- 방어수치 (예: '48K', '578K')
);

insert into castle_troops (level, garrison, unit_count, defense_army, defense_rating) values
  ('1',  32700, 50,  27300, '48K'),
  ('시', 32700, 570, 27300, '578K');

alter table castle_troops enable row level security;
create policy "Public read" on castle_troops for select using (true);
create policy "Service all"  on castle_troops for all   using (true);


-- ── castles (성위치) ──
create table castles (
  name          text    primary key,
  level         text    not null references castle_troops(level),
  x             integer not null,
  y             integer not null,
  alliance_abbr text    references alliances(abbr)  -- NULL = 미점령
);

create index on castles (alliance_abbr);
create index on castles (level);

insert into castles (name, level, x, y, alliance_abbr) values
  ('팽성',   '1',  1574, 620,  '한'),
  ('임기',   '1',  1802, 620,  '은'),
  ('단양',   '1',  1490, 326,  '향_2'),
  ('오현',   '1',  1652, 221,  '은'),
  ('번성',   '1',  1070, 746,  '한'),
  ('익양',   '1',  1190, 740,  '한'),
  ('시상',   '1',  1046, 464,  '은'),
  ('게양',   '1',   836, 341,  '환'),
  ('침현',   '시',  812, 539,  null),
  ('노현',   '시', 1670, 710,  null),
  ('안풍',   '시', 1178, 578,  null),
  ('광릉',   '시', 1610, 374,  null),
  ('무현',   '1',   650, 866,  null),
  ('백제성', '1',   530, 794,  '라');

alter table castles enable row level security;
create policy "Public read" on castles for select using (true);
create policy "Service all"  on castles for all   using (true);
