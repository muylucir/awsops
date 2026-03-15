# 라이브러리 모듈

## 역할
핵심 라이브러리: Steampipe 데이터베이스 연결, SQL 쿼리 정의, 인벤토리, 설정 관리.

> Core libraries: Steampipe database connection, SQL query definitions, inventory, config management.

## 주요 파일
- `steampipe.ts` — pg 풀 연결 (max 5, 120s 타임아웃, 5분 TTL 캐시, Cost 가용성 probe)
- `resource-inventory.ts` — 리소스 인벤토리 스냅샷 (data/inventory/, 추가 쿼리 0건)
- `cost-snapshot.ts` — Cost 데이터 스냅샷 폴백 (data/cost/)
- `app-config.ts` — 앱 설정 (costEnabled, agentRuntimeArn, codeInterpreterName)
- `queries/*.ts` — 22개 SQL 쿼리 파일 (ebs, msk, opensearch 포함)

> steampipe.ts: pg Pool (max 5, 120s timeout, 5min TTL cache, checkCostAvailability)
> 22 SQL query files including ebs, msk, opensearch

## 규칙
- 모든 DB 접근은 `steampipe.ts`의 `runQuery()` 또는 `batchQuery()`를 통해 수행
- Steampipe CLI 사용 금지 — pg Pool이 660배 빠름
- Steampipe는 `--database-listen network`으로 실행 (VPC Lambda :9193 접근)
- 쿼리 작성 전 `information_schema.columns`로 컬럼명 확인
- JSONB 중첩 주의: MSK `provisioned`, OpenSearch `encryption_at_rest_options`
- SQL에서 `$` 사용 금지 — `conditions::text LIKE '%..%'` 사용
- 목록 쿼리에서 SCP 차단 컬럼 사용 금지: `mfa_enabled`, `attached_policy_arns`, Lambda `tags`

> ALL database access through runQuery() or batchQuery(). Never Steampipe CLI.
> Verify column names via information_schema. Watch JSONB nesting (MSK, OpenSearch).
> No $ in SQL. Avoid SCP-blocked columns in list queries.
