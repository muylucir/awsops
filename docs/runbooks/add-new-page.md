# Runbook: 새 대시보드 페이지 추가 / Add New Dashboard Page

## 단계 / Steps

### 1. 테이블 컬럼 확인 / Verify Table Columns
```bash
steampipe query "SELECT column_name FROM information_schema.columns WHERE table_name = 'aws_NEW_TABLE'" --output json --input=false
```

### 2. 쿼리 파일 생성 / Create Query File
```bash
# src/lib/queries/newservice.ts
export const queries = {
  summary: `SELECT COUNT(*) AS total FROM aws_new_table`,
  list: `SELECT col1, col2 FROM aws_new_table ORDER BY col1`,
  detail: `SELECT * FROM aws_new_table WHERE id = '{id}'`,
};
```

### 3. 페이지 생성 / Create Page
```bash
# src/app/newservice/page.tsx
# src/app/ec2/page.tsx의 패턴을 복사
# (Copy pattern from src/app/ec2/page.tsx)
# 포함 항목: 'use client', fetchData, StatsCard, DataTable, 상세 패널
# (Include: 'use client', fetchData, StatsCard, DataTable, detail panel)
```

### 4. 사이드바에 추가 / Add to Sidebar
`src/components/layout/Sidebar.tsx` 편집:
(Edit `src/components/layout/Sidebar.tsx`:)
- 적절한 `navGroup`에 추가 — Compute, Network, Storage, Monitoring, Security
  (Add to appropriate `navGroup` — Compute, Network, Storage, Monitoring, Security)
- `lucide-react`에서 아이콘 임포트
  (Import icon from `lucide-react`)

### 5. 빌드 및 검증 / Build & Verify
```bash
npm run build
bash scripts/09-verify.sh
```

## 체크리스트 / Checklist
- [ ] fetch URL이 `/awsops/api/steampipe`를 사용하는지 확인 (fetch URL uses `/awsops/api/steampipe`)
- [ ] 컴포넌트 임포트가 default인지 확인 — named 아님 (Component imports are default, not named)
- [ ] StatsCard color에 이름('cyan')을 사용하는지 확인 — hex 아님 (StatsCard color uses name ('cyan') not hex)
- [ ] 리스트 쿼리에 SCP 차단 컬럼이 없는지 확인 (No SCP-blocked columns in list query)
- [ ] 상세 패널이 Section/Row 헬퍼를 사용하는지 확인 (Detail panel uses Section/Row helpers)
