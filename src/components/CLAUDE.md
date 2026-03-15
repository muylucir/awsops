# 컴포넌트 모듈

## 역할
페이지 전반에 걸쳐 사용되는 공유 React 컴포넌트. 레이아웃, 카드, 차트, 테이블, K8s UI.

> Shared React components: layout, cards, charts, tables, K8s UI.

## 주요 파일 (14개)

### layout/ — 레이아웃 (2)
- `layout/Sidebar.tsx` — 메인 네비게이션 (6개 그룹: Overview/Compute/Network & CDN/Storage & DB/Monitoring/Security)
- `layout/Header.tsx` — 페이지 헤더 (새로고침, Sign Out)

### dashboard/ — 대시보드 카드 (4)
- `dashboard/StatsCard.tsx` — 통계 카드 (color prop: 이름 문자열)
- `dashboard/LiveResourceCard.tsx` — 실시간 리소스 카드
- `dashboard/CategoryCard.tsx` — 카테고리 카드
- `dashboard/StatusBadge.tsx` — 상태 배지 (`status` prop만 받음 — `text` prop 없음)

### charts/ — Recharts 차트 래퍼 (3)
- `charts/BarChartCard.tsx` — 바 차트
- `charts/LineChartCard.tsx` — 라인 차트
- `charts/PieChartCard.tsx` — 파이 차트

### table/ — 데이터 테이블 (1)
- `table/DataTable.tsx` — 범용 데이터 테이블 (정렬, render 함수)

### k8s/ — K8s 전용 (4)
- `k8s/K9sResourceTable.tsx` — K9s 스타일 리소스 테이블
- `k8s/K9sDetailPanel.tsx` — K9s 상세 패널
- `k8s/K9sClusterHeader.tsx` — K9s 클러스터 헤더
- `k8s/NamespaceFilter.tsx` — 네임스페이스 필터

> 14 components: 2 layout, 4 dashboard, 3 charts, 1 table, 4 K8s
> StatusBadge: only `status` prop (no `text` prop)

## 규칙
- 모든 컴포넌트는 `export default`
- Tailwind 클래스는 테마 토큰 사용: navy-*, accent-*
- color 속성은 hex가 아닌 이름 문자열: 'cyan', 'green', 'purple', 'orange', 'red', 'pink'
- Sign Out: `POST /api/auth` (HttpOnly 쿠키 서버 사이드 삭제)

> All components use export default. Color prop: names not hex.
> Sign Out: POST /api/auth (server-side HttpOnly cookie deletion).
