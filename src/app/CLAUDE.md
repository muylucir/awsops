# 앱 모듈 / App Module

## 역할 / Role
Next.js 14 App Router 페이지 및 API 라우트. 각 하위 디렉토리는 라우트 세그먼트.
(Next.js 14 App Router pages and API routes. Each subdirectory is a route segment.)

## 주요 파일 / Key Files
- `layout.tsx` — 사이드바와 글로벌 스타일이 포함된 루트 레이아웃 (Root layout with Sidebar and global styles)
- `page.tsx` — 대시보드 홈 페이지 (Dashboard home page)
- `globals.css` — Tailwind 기본 + 커스텀 테마 변수 (Tailwind base + custom theme variables)
- `api/steampipe/route.ts` — 메인 Steampipe 쿼리 엔드포인트 (Main Steampipe query endpoint)
- `api/ai/route.ts` — AI 라우팅, 9단계 우선순위: Code→Infra→IaC→Data→Security→Monitoring→Cost→AWSData→Ops (AI routing, 9-route priority)
- `api/code/route.ts` — 코드 인터프리터 엔드포인트 (Code interpreter endpoint)
- `api/benchmark/route.ts` — CIS 컴플라이언스 벤치마크 엔드포인트 (CIS Compliance benchmark endpoint)

## 규칙 / Rules
- 모든 페이지 파일은 `'use client'`로 시작해야 함
  (Every page file must start with `'use client'`)
- 모든 fetch URL에 `/awsops/api/*` 접두사 필수 — basePath 자동 적용 안 됨
  (All fetch URLs must use `/awsops/api/*` prefix — basePath not auto-applied)
- 컴포넌트는 기본 내보내기로 임포트: `{ X }` 형태가 아닌 `import X from '...'`
  (Components imported as default: `import X from '...'` — NOT `{ X }`)
- StatsCard/LiveResourceCard의 `color` 속성은 hex가 아닌 이름('cyan') 사용
  (StatsCard/LiveResourceCard `color` prop uses names ('cyan') not hex)
- 새 페이지: `docs/runbooks/add-new-page.md`의 패턴을 따를 것
  (New pages: follow the pattern in `docs/runbooks/add-new-page.md`)
