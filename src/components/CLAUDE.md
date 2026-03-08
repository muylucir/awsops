# 컴포넌트 모듈 / Components Module

## 역할 / Role
페이지 전반에 걸쳐 사용되는 공유 React 컴포넌트. 레이아웃 컴포넌트, 카드, 차트, UI 기본 요소.
(Shared React components used across pages. Layout components, cards, charts, and UI primitives.)

## 주요 파일 / Key Files
- `layout/Sidebar.tsx` — 메인 네비게이션, 6개 그룹 (Main navigation, 6 groups)
- 재사용 가능 카드: StatsCard, LiveResourceCard (Reusable cards)
- Recharts 기반 차트 래퍼 (Chart wrappers using Recharts)
- React Flow 기반 네트워크 토폴로지 (Network topology using React Flow)

## 규칙 / Rules
- 모든 컴포넌트는 `export default` 사용
  (All components use `export default`)
- Tailwind 클래스는 테마 토큰 사용: navy-*, 강조색
  (Tailwind classes use theme tokens: navy-*, accent colors)
- color 속성은 hex 값이 아닌 이름 문자열 허용: 'cyan', 'green', 'purple'
  (Color prop accepts name strings, not hex values)
