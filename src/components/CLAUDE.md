# 컴포넌트 모듈 / Components Module

## 역할 / Role
페이지 전반에 걸쳐 사용되는 공유 React 컴포넌트. 레이아웃 컴포넌트, 카드, 차트, UI 기본 요소.
(Shared React components used across pages. Layout components, cards, charts, and UI primitives.)

## 주요 파일 (14 components) / Key Files

### layout/ — 레이아웃 (2)
- `layout/Sidebar.tsx` — 메인 네비게이션, 6개 그룹: Overview/Compute/Network & CDN/Storage & DB/Monitoring/Security (Main navigation, 6 groups)
- `layout/Header.tsx` — 페이지 헤더 (Page header)

### dashboard/ — 대시보드 카드 (3)
- `dashboard/StatsCard.tsx` — 통계 카드 (Stats card with color prop)
- `dashboard/LiveResourceCard.tsx` — 실시간 리소스 카드 (Live resource card)
- `dashboard/CategoryCard.tsx` — 카테고리 카드 (Category card)
- `dashboard/StatusBadge.tsx` — 상태 배지, `status` prop만 받음 (Status badge, accepts only `status` prop — no `text`)

### charts/ — Recharts 차트 래퍼 (3)
- `charts/BarChartCard.tsx` — 바 차트 (Bar chart wrapper)
- `charts/LineChartCard.tsx` — 라인 차트 (Line chart wrapper)
- `charts/PieChartCard.tsx` — 파이 차트 (Pie chart wrapper)

### table/ — 데이터 테이블 (1)
- `table/DataTable.tsx` — 범용 데이터 테이블 (Generic data table)

### k8s/ — K8s 전용 (4)
- `k8s/K9sResourceTable.tsx` — K9s 스타일 리소스 테이블 (K9s-style resource table)
- `k8s/K9sDetailPanel.tsx` — K9s 상세 패널 (K9s detail panel)
- `k8s/K9sClusterHeader.tsx` — K9s 클러스터 헤더 (K9s cluster header)
- `k8s/NamespaceFilter.tsx` — 네임스페이스 필터 (Namespace filter)

## 규칙 / Rules
- 모든 컴포넌트는 `export default` 사용
  (All components use `export default`)
- Tailwind 클래스는 테마 토큰 사용: navy-*, 강조색
  (Tailwind classes use theme tokens: navy-*, accent colors)
- color 속성은 hex 값이 아닌 이름 문자열 허용: 'cyan', 'green', 'purple'
  (Color prop accepts name strings, not hex values)
