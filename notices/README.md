# notices/ 폴더 작성 요령

이 폴더의 `.md` 파일은 **git push만으로 공지 목록에 자동 노출**됩니다.

---

## 파일 구조

```yaml
---
title: ⚔️ 전략          # 공지 제목 (자동 제목: 🚨 긴급 / 📢 공지 / ⚔️ 전략)
category: strategy       # 카테고리: notice / urgent / strategy / general
date: "2026-04-19"       # 날짜 (YY-MM-DD)
time: "20:40"            # 시간 (HH:MM)
publish: true            # true = 공지 노출 / false 또는 없으면 템플릿으로만 사용
is_pinned: false         # true = 상단 고정
---

본문 내용...
```

---

## 좌표 작성법

| 상황 | 마크다운 | 화면 표시 | 카카오 복사 |
| --- | --- | --- | --- |
| 좌표 있음 | `[낙양](1247,873)` | 📍 낙양 (1247, 873) | 📍낙양(1247,873) |
| 좌표 모름 | `[낙양](map-search)` | 📍 낙양 전체지도에서 검색🔎 | 📍낙양 |

> X·Y 좌표는 게임 내 지도에서 확인. 모를 경우 `map-search` 사용.

### 예시

```markdown
**한나라**: [낙양](1247,873) 공성 ⏲ 20:00
**대한제국**: [동병](map-search) 공성 ⏲ 21:00
```

---

## 일정·시간 작성법

```markdown
📆 26-04-19 ⏲ 20:40        # 날짜+시간 한 줄
⏲ 20:00 공성 종료 후 이동   # 시간만 단독
```

- `📆 YY-MM-DD` — 날짜
- `⏲ HH:MM` — 시간
- 대상별 시간이 다를 때: 각 줄 끝에 `⏲ HH:MM` 붙이기

---

## 카테고리별 자동 제목

| category | 자동 제목 |
| --- | --- |
| `urgent` | 🚨 긴급 |
| `notice` | 📢 공지 |
| `strategy` | ⚔️ 전략 |
| `general` | 직접 입력 |

---

## 공지 발행 흐름

```bash
# 1. 파일 작성 (publish: true 필수)
# 2. 커밋 & 푸시
git add notices/새공지.md
git commit -m "feat: 공지 추가"
git push
# → Vercel 자동 재배포 → 홈 공지 목록에 노출
```

> `publish: true` 없으면 `/write` 폼의 템플릿 목록에만 뜹니다.
