# 지도 기능 설계 문서

## 1. 개요

`/info` 페이지의 **지도** 탭에 삼국지 전략 게임 맵을 구현한다.
2000×2000 좌표계 위에 성(城) 위치를 점령 동맹 진영 색상으로 표시하고,
클릭/호버 시 성 레벨에 맞는 부대 정보를 팝업으로 보여준다.

---

## 2. 데이터베이스 설계

**선택: Supabase (PostgreSQL)** — 이미 프로젝트에서 사용 중인 인프라를 그대로 활용.
YAML 방식은 관계(FK, JOIN)와 타입 안전성 보장이 어려워 채택하지 않음.

### 2-1. ERD 관계

```
factions (진영)
    │  1
    │  ├─────────────────────────────────────────────────┐
    │  N                                                  N
alliances (동맹)                                      (색상 참조용)
    │  1
    │  N
castles (성위치)
    │  N ── level ── 1
castle_troops (성부대)
```

### 2-2. 테이블 스키마 (Supabase SQL)

```sql
-- ── factions (진영색상) ──
create table factions (
  id          text primary key,    -- '위' | '촉' | '오'
  color_label text not null,       -- '하늘색' | '연두색' | '옅은빨강'
  color_hex   text not null        -- '#87CEEB' | '#86EFAC' | '#FCA5A5'
);

insert into factions values
  ('위', '하늘색',   '#7DD3FC'),
  ('촉', '연두색',   '#86EFAC'),
  ('오', '옅은빨강', '#FCA5A5');

alter table factions enable row level security;
create policy "Public read" on factions for select using (true);
create policy "Service all"  on factions for all   using (true);


-- ── alliances (동맹정보) ──
create table alliances (
  abbr       text primary key,          -- 호 (단축키): '라', '은', '한', '향_2', '환' …
  name       text not null,             -- 동맹이름: '대한제국', '은하수' …
  faction_id text not null references factions(id)
);

create index on alliances (faction_id);

alter table alliances enable row level security;
create policy "Public read" on alliances for select using (true);
create policy "Service all"  on alliances for all   using (true);


-- ── castle_troops (성부대) ──
create table castle_troops (
  level          text    primary key,   -- '1'~'10', '시', '관문' 등
  garrison       integer not null,      -- 주성수비병력
  unit_count     integer not null,      -- 부대수
  defense_army   integer not null,      -- 성방어군
  defense_rating text    not null       -- 방어수치 ('48K', '578K' …)
);

insert into castle_troops values
  ('1',  32700, 50,  27300, '48K'),
  ('시', 32700, 570, 27300, '578K');
-- 나머지 레벨 추가 예정

alter table castle_troops enable row level security;
create policy "Public read" on castle_troops for select using (true);
create policy "Service all"  on castle_troops for all   using (true);


-- ── castles (성위치) ──
create table castles (
  name          text    primary key,    -- 성이름 (고유)
  level         text    not null references castle_troops(level),
  x             integer not null,
  y             integer not null,
  alliance_abbr text    references alliances(abbr)   -- NULL = 미점령(회색)
);

create index on castles (alliance_abbr);
create index on castles (level);

alter table castles enable row level security;
create policy "Public read" on castles for select using (true);
create policy "Service all"  on castles for all   using (true);
```

### 2-3. 데이터 흐름 (JOIN 경로)

```
castles.alliance_abbr → alliances.abbr → alliances.faction_id → factions.color_hex
castles.level          → castle_troops.*
```

---

## 3. API 설계

### `GET /api/map/data`

Supabase 단일 쿼리로 지도 렌더링에 필요한 모든 데이터를 반환한다.

**Response (JSON)**:
```ts
{
  castles: Array<{
    name: string
    level: string
    x: number
    y: number
    alliance_abbr: string | null
    alliance_name: string | null
    faction_id: string | null
    color_hex: string         // null → '#9CA3AF' (회색)
    troops: {
      garrison: number
      unit_count: number
      defense_army: number
      defense_rating: string
    }
  }>
  factions: Array<{ id: string; color_label: string; color_hex: string }>
  alliances: Array<{ abbr: string; name: string; faction_id: string }>
}
```

**Supabase Query**:
```ts
const { data } = await supabase
  .from('castles')
  .select(`
    name, level, x, y, alliance_abbr,
    alliance:alliances ( name, faction_id,
      faction:factions ( color_hex )
    ),
    troops:castle_troops ( garrison, unit_count, defense_army, defense_rating )
  `)
```

---

## 4. 프론트엔드 설계

### 4-1. 컴포넌트 구조

```
app/info/page.tsx          (기존 — 탭 전환만 담당)
└─ app/info/components/
   ├─ MapView.tsx           (데이터 fetch + 상태 관리)
   ├─ MapCanvas.tsx         (SVG 렌더링 엔진)
   ├─ CastleMarker.tsx      (성 마커 dot/아이콘)
   └─ CastlePopup.tsx       (hover/click 팝업)
```

### 4-2. 렌더링 방식 — SVG

| 방식 | 이유 |
|------|------|
| **SVG** ✅ | DOM 이벤트(hover/click) 자연스럽게 처리, 좌표계 직결, CSS 변수 색상 적용 용이 |
| Canvas | 이벤트 처리 복잡, 히트 테스트 직접 구현 필요 |

### 4-3. 좌표 변환

게임 좌표(0–2000) → SVG viewBox `0 0 2000 2000`으로 1:1 매핑.
Pan/Zoom은 CSS `transform: scale() translate()`로 처리 (SVG 내부 재계산 불필요).

```
SVG viewBox = "0 0 2000 2000"
성 x/y 좌표 → <circle cx={x} cy={y} />
```

### 4-4. 색상 결정 로직

```ts
function getCastleColor(castle: CastleData): string {
  if (!castle.alliance_abbr) return '#9CA3AF'       // 미점령 → 회색
  return castle.alliance?.faction?.color_hex ?? '#9CA3AF'
}
```

### 4-5. MapView 상태

```ts
type MapState = {
  data: MapData | null
  loading: boolean
  zoom: number            // 1.0 ~ 5.0
  offset: { x: number; y: number }   // pan offset (px)
  selected: CastleData | null        // 클릭 팝업
  hovered: CastleData | null         // hover 팝업
}
```

### 4-6. MapCanvas SVG 구조

```svg
<svg viewBox="0 0 2000 2000" style="transform: scale(zoom) translate(offset)">
  <!-- Layer 1: 격자 -->
  <GridLayer step={200} />

  <!-- Layer 2: 성 마커 -->
  <g id="castles">
    {castles.map(c => <CastleMarker key={c.name} castle={c} />)}
  </g>

  <!-- Layer 3: 팝업 (SVG foreignObject 또는 absolute div) -->
  <CastlePopup castle={selected ?? hovered} />
</svg>
```

### 4-7. GridLayer

- 200 단위 격자선: 연한 선(opacity 0.15)
- 400 단위마다 좌표 레이블 표시 (e.g. `(400, 800)`)
- 배경: `var(--bg-1)` 다크/라이트 테마 자동 대응

### 4-8. CastleMarker

```tsx
<g
  onMouseEnter={() => setHovered(castle)}
  onMouseLeave={() => setHovered(null)}
  onClick={() => setSelected(castle)}
  style={{ cursor: 'pointer' }}
>
  {/* 히트 영역 확대 (투명 원) */}
  <circle cx={x} cy={y} r={12} fill="transparent" />
  {/* 성 마커 */}
  <circle cx={x} cy={y} r={5} fill={color} stroke="white" strokeWidth={1} />
  {/* 성 이름 레이블 (zoom ≥ 2 일 때만 표시) */}
  {zoom >= 2 && <text x={x} y={y - 8} fontSize={10}>{castle.name}</text>}
</g>
```

### 4-9. CastlePopup

팝업은 SVG 외부에 `position: absolute` div로 렌더링 (CSS transform 영향 없음).
마우스 좌표 기준으로 팝업 위치 계산.

```
┌─────────────────────────────┐
│  📍 팽성  (성 레벨 1)         │
│  점령: 한 (한국) · 촉 진영    │
│  ─────────────────────────  │
│  주성수비: 32,700             │
│  부대수:       50            │
│  성방어군: 27,300             │
│  방어수치:    48K             │
└─────────────────────────────┘
```

### 4-10. 범례 (Legend)

지도 우측 하단 고정 패널:
```
● 위 진영 (하늘색)
● 촉 진영 (연두색)
● 오 진영 (옅은빨강)
● 미점령 (회색)
```

---

## 5. 파일 구조

```
app/
├─ api/
│   └─ map/
│       └─ data/
│           └─ route.ts          ← Supabase 쿼리 + JSON 응답
├─ info/
│   ├─ page.tsx                  ← 기존 탭 컨테이너 (MapView 삽입)
│   └─ components/
│       ├─ MapView.tsx
│       ├─ MapCanvas.tsx
│       ├─ CastleMarker.tsx
│       └─ CastlePopup.tsx
lib/
└─ supabase.sql                  ← factions, alliances, castle_troops, castles 추가
```

---

## 6. 구현 순서

| 단계 | 작업 |
|------|------|
| 1 | Supabase SQL 실행 — 4개 테이블 생성 + 샘플 데이터 INSERT |
| 2 | `app/api/map/data/route.ts` — JOIN 쿼리 API 구현 |
| 3 | `MapView.tsx` — fetch + 로딩/에러 상태 |
| 4 | `MapCanvas.tsx` — SVG viewBox + GridLayer + pan/zoom |
| 5 | `CastleMarker.tsx` — 색상 매핑 + hover/click 이벤트 |
| 6 | `CastlePopup.tsx` — 부대 정보 팝업 |
| 7 | `app/info/page.tsx` — MapView 연결 |
| 8 | 범례(Legend) 컴포넌트 |

---

## 7. 디자인 원칙

- **iOS-native 감성**: 기존 `seg-control`, `var(--bg-*)`, `var(--label-*)` CSS 변수 유지
- **다크/라이트 모드 자동 대응**: 색상에 CSS 변수 우선, 진영 색상은 명시적 hex
- **모바일 대응**: 터치 pan/pinch-zoom (`touch-action: none` + PointerEvent API)
- **성능**: 마커 50개 미만 → SVG DOM 직접 렌더 (Canvas 불필요)
- **접근성**: 키보드 Tab + Enter로 성 선택 가능하도록 `tabIndex` 적용
