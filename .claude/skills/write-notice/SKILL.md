---
name: write-notice
description: >-
  자연어 입력을 notices/*.md 공지 파일로 변환한다.
  Usage: /write-notice [자연어 내용]
  notices/README.md 형식을 따르며, publish: true로 저장하면
  git push만으로 공지 목록에 자동 노출된다.
allowed-tools: Read, Write, Bash
---

# write-notice — 자연어 → notices/*.md 변환

## Role

사용자가 입력한 자연어를 분석해 `notices/` 폴더에 마크다운 공지 파일을 생성한다.
`notices/README.md`의 형식 규칙을 따른다.

## Step 1 — 참고 파일 읽기 (parallel)

다음을 동시에 읽는다:

- `notices/README.md` — 작성 규칙·포맷
- `notices/북진경로.md` — 실제 예시 파일

## Step 2 — 자연어 분석

입력에서 아래 요소를 추출한다:

| 요소 | 예시 | 없으면 |
| --- | --- | --- |
| 카테고리 | 전략/긴급/공지/일반 | `strategy` 기본값 |
| 대상 맹 | 한나라, 대한제국, 호표기, 곽회사단 | 생략 |
| 지역명 | 낙양, 옥문관 | 필수 |
| 좌표 X,Y | 숫자 언급 시 | 없으면 `map-search` |
| 행동 | 공성, 진출, 요새작, 길작 등 | 생략 |
| 날짜 | YY-MM-DD, 오늘/내일 등 | 오늘 날짜 |
| 시간 | HH:MM | 생략 가능 |

## Step 3 — 마크다운 콘텐츠 생성 규칙

### 좌표 형식

- 좌표 있음: `[낙양](1247,873)` → 웹에서 **📍 낙양 (1247, 873)** 배지로 렌더링
- 좌표 모름: `[낙양](map-search)` → 웹에서 **📍 낙양 전체지도에서 검색🔎** 배지

> 반드시 마크다운 링크 `[지역명](...)` 형식으로 작성할 것.
> `📍` 이모지를 직접 텍스트에 쓰지 않는다 — MarkdownRenderer가 자동 추가함.

### 날짜·시간 형식

```
📆 26-04-19 ⏲ 20:40   ← 날짜+시간 한 줄로 붙임
```

- 날짜만: `📆 26-04-19`
- 대상별 시간이 다를 때: 각 줄 끝에 `⏲ HH:MM`

### 대상별 줄 형식

```markdown
**한나라**: [낙양](1247,873) 공성 ⏲ 20:00
**대한제국**: [동병](map-search) 공성 ⏲ 21:00
```

### 카테고리별 title

| category | title |
| --- | --- |
| `urgent` | `🚨 긴급` |
| `notice` | `📢 공지` |
| `strategy` | `⚔️ 전략` |
| `general` | 자유 입력 |

## Step 4 — 파일명 결정

- 입력 내용에서 핵심 키워드 1~2개로 한글 파일명 결정
- 예: `북진경로2.md`, `옥문관요새작.md`, `긴급집결.md`
- 이미 존재하는 파일명이면 숫자 접미사 추가

기존 파일 목록 확인:

```bash
ls notices/*.md
```

## Step 5 — 파일 생성

아래 템플릿으로 `notices/<파일명>.md` 작성:

```markdown
---
title: <카테고리 title>
category: <category>
date: "<YYYY-MM-DD>"
time: "<HH:MM>"
publish: true
---

<본문>
```

- `publish: true` 항상 포함
- 날짜가 명시되지 않으면 오늘 날짜 사용 (시스템 날짜 기준)
- 시간이 없으면 `time` 줄 생략

## Step 6 — 결과 보고

생성된 파일 경로와 내용 미리보기를 출력한다.
이후 "git push하면 공지에 바로 노출됩니다" 안내.
